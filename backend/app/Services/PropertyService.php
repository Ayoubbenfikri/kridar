<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Exceptions\PropertySuspendedException;
use App\Exceptions\PublicationFeeRequiredException;
use App\Models\Property;
use App\Models\User;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
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

        $property = $this->properties->create($data);

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

        // Phase 22 (pricing) — close the back door. Publishing a
        // short-term listing is free, so without this an owner could
        // publish as short_term and then edit rental_type to long_term,
        // landing in paid long-term search for nothing. If the edit
        // makes the fee owed and it isn't paid, the listing drops back
        // to draft until it is.
        if ($property->status === PropertyStatus::Published && $property->isBlockedByPublicationFee()) {
            $property = $this->properties->update($property, [
                'status' => PropertyStatus::Draft,
                'published_at' => null,
            ]);
        }

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
