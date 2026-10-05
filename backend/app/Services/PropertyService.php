<?php

namespace App\Services;

use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Enums\PublicationStatus;
use App\Exceptions\PropertySuspendedException;
use App\Exceptions\PublicationFeeRequiredException;
use App\Models\Property;
use App\Models\User;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PropertyService
{
    public function __construct(
        private readonly PropertyRepositoryInterface $properties,
    ) {}

    /**
     * @param  array<string, mixed>  $filters  validated PropertySearchRequest data
     */
    public function listPublished(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->properties->paginatePublished($filters, $perPage);
    }

    /**
     * Data for the price slider: range, step and the bars of the price
     * distribution, for the kind of search described by $filters
     * (listing_type, rental_type). Same price-column rule as the search.
     *
     * @param  array<string, mixed>  $filters  validated PriceHistogramRequest data
     * @return array<string, mixed>
     */
    public function priceHistogram(array $filters = []): array
    {
        $prices = $this->properties->publishedPrices(
            $filters['listing_type'] ?? ListingType::Rent->value,
            $filters['rental_type'] ?? null,
        );

        return PriceHistogramBuilder::build($prices);
    }

    public function listForOwner(User $owner, int $perPage = 15): LengthAwarePaginator
    {
        return $this->properties->paginateForOwner($owner->id, $perPage);
    }

    /**
     * @param  array<string, mixed>  $data  validated StorePropertyRequest data
     */
    public function create(array $data, User $owner): Property
    {
        $amenityIds = $data['amenity_ids'] ?? [];
        unset($data['amenity_ids']);

        $data['owner_id'] = $owner->id; // never trust an owner_id from the frontend
        $data['slug'] = $this->generateUniqueSlug($data['title']);
        $data['status'] = PropertyStatus::Draft; // every listing starts as a draft, see Phase 5 plan
        $data['currency'] = 'MAD';

        // Property sales: a request that never mentioned listing_type is a
        // rental. Set explicitly (rather than leaving it to the column
        // default) so the model returned below already carries the value.
        $data['listing_type'] = $data['listing_type'] ?? ListingType::Rent->value;

        // A sale may legitimately omit bedrooms/bathrooms (a plot of land
        // has none), but the columns are NOT NULL with a default of 0.
        // A rental never gets here without them — StorePropertyRequest
        // requires both.
        if ($data['listing_type'] === ListingType::Sale->value) {
            $data['bedrooms'] = $data['bedrooms'] ?? 0;
            $data['bathrooms'] = $data['bathrooms'] ?? 0;
        }

        // Phase 29 (monetization) — decide, ONCE, whether THIS listing is
        // the owner's free one, and insert the property, IN THE SAME
        // transaction. Locking the owner row is what keeps two parallel
        // "create a property" requests from both reading
        // has_used_free_listing as false and both getting a free
        // listing; doing the insert in the same transaction is what
        // keeps a failed insert (e.g. a slug collision) from spending the
        // free slot for a property that was never actually created.
        //
        // Deliberately independent of rental_type: every owner's very
        // first property is free, whatever kind it is; every one after
        // that owes the fee. This is the only place that flag is ever
        // set, and it is never unset again (PropertyService has no
        // "restore the free slot" path) — deleting the free listing
        // later does not hand out a second one.
        $property = DB::transaction(function () use ($data, $owner) {
            $lockedOwner = User::query()->lockForUpdate()->findOrFail($owner->id);

            if ($lockedOwner->has_used_free_listing) {
                $data['publication_status'] = PublicationStatus::PendingPayment;
                $data['publication_paid_at'] = null;
            } else {
                // Direct assignment + save(), NOT ->update([...]) — the
                // same reason AdminService sets $user->status directly
                // instead of $user->update(['status' => ...]):
                // has_used_free_listing is deliberately absent from
                // User::$fillable (system-controlled, see that class), so
                // ->update() would silently no-op on it. That bug shipped
                // once already (caught by
                // PublicationFeeTest::test_an_owners_second_listing_owes_the_fee
                // — every listing was coming back free) and direct
                // assignment is the fix, not adding the column back to
                // $fillable, which would let a request body set it too.
                $lockedOwner->has_used_free_listing = true;
                $lockedOwner->save();
                $data['publication_status'] = PublicationStatus::Paid;
                $data['publication_paid_at'] = now();
            }

            return $this->properties->create($data);
        });

        if (! empty($amenityIds)) {
            $this->properties->syncAmenities($property, $amenityIds);
        }

        return $property->load(['amenities', 'images']);
    }

    /**
     * @param  array<string, mixed>  $data  validated UpdatePropertyRequest data
     */
    public function update(Property $property, array $data): Property
    {
        $amenityIds = $data['amenity_ids'] ?? null;
        unset($data['amenity_ids']);

        // Title changed? Re-slugify so the URL stays readable — but only
        // if the title actually changed, so we don't churn the slug (and
        // break any bookmarked/shared link) on every unrelated edit.
        if (isset($data['title']) && $data['title'] !== $property->title) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], $property->id);
        }

        $property = $this->properties->update($property, $data);

        if ($amenityIds !== null) {
            $this->properties->syncAmenities($property, $amenityIds);
        }

        // Phase 22 had a "back door" here: publish as short-term (free),
        // then edit rental_type to long-term to reach paid search for
        // nothing. Phase 29 removes it instead of patching it further —
        // the fee no longer depends on rental_type at all (it is decided
        // once, per OWNER, at Property::create() time), so editing
        // rental_type on an already-published, already-paid-for listing
        // has nothing left to dodge.
        return $property->load(['amenities', 'images']);
    }

    public function delete(Property $property): bool
    {
        return $this->properties->delete($property);
    }

    public function publish(Property $property): Property
    {
        // A suspension is an admin-only lock (Phase 13) - the owner's own
        // publish button can't lift it, only AdminService::approveProperty()
        // can. Otherwise suspending a listing would have no real effect.
        if ($property->status === PropertyStatus::Suspended) {
            throw new PropertySuspendedException(
                'This property was suspended by an administrator and can only be republished by one.'
            );
        }

        // Phase 22 (pricing) — THE enforcement point for the long-term
        // business model. A listing that appears in long-term search
        // goes live only once its one-off publication fee is settled.
        // The frontend hides the publish button in that case, but this
        // is what actually guarantees it (project rule: the backend
        // validates, a frontend value is never trusted).
        //
        // Note this is deliberately NOT in AdminService::approveProperty():
        // an admin publishing a listing by hand is an override (cash paid
        // at the office, a goodwill gesture), and overriding is the whole
        // point of an admin action.
        if ($property->isBlockedByPublicationFee()) {
            throw new PublicationFeeRequiredException(
                'This listing appears in long-term search, so its publication fee must be paid before it can go live.'
            );
        }

        return $this->properties->update($property, [
            'status' => PropertyStatus::Published,
            'published_at' => now(),
        ]);
    }

    public function unpublish(Property $property): Property
    {
        return $this->properties->update($property, [
            'status' => PropertyStatus::Draft,
            'published_at' => null,
        ]);
    }

    private function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $suffix = 1;

        while ($this->properties->slugExists($slug, $ignoreId)) {
            $suffix++;
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
