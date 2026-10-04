<?php

namespace App\Repositories\Eloquent;

use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Enums\RentalType;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentPropertyRepository implements PropertyRepositoryInterface
{
    public function paginatePublished(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        // Rentals unless a sale search was explicitly asked for. This
        // default is what keeps properties for sale out of the rental
        // list, the map and the home page, which never send the filter.
        $listingType = $filters['listing_type'] ?? ListingType::Rent->value;
        $isSale = $listingType === ListingType::Sale->value;

        // A property for sale has no rental_type and no guest capacity, so
        // those two filters could only ever empty the result. Ignored
        // (not refused) in a sale search: a client that keeps a leftover
        // rental filter in its URL still gets a sensible list.
        $rentalType = $isSale ? null : ($filters['rental_type'] ?? null);
        $maxGuests = $isSale ? null : ($filters['max_guests'] ?? null);

        // The ONE column "price" means in this search. Used by the price
        // range filter and by the price sort, so they can never disagree.
        // Always one of three fixed names — never user input — which is
        // what makes it safe to put in orderByRaw() below.
        $priceColumn = match (true) {
            $isSale => 'sale_price',
            $rentalType === RentalType::LongTerm->value => 'price_per_month',
            default => 'price_per_night', // short_term, both, or no rental_type given
        };

        $sort = $filters['sort'] ?? 'newest';

        return Property::query()
            ->where('status', PropertyStatus::Published)
            ->where('listing_type', $listingType)
            ->when($filters['q'] ?? null, function (Builder $query, string $q) {
                // Free-text search: title OR city contains the term.
                $query->where(function (Builder $sub) use ($q) {
                    $sub->where('title', 'like', "%{$q}%")
                        ->orWhere('city', 'like', "%{$q}%");
                });
            })
            ->when($filters['city'] ?? null, function (Builder $query, string $city) {
                // Separate from "q" above: this is an exact match, meant
                // for a structured "pick a city" filter rather than the
                // free-text search box.
                $query->whereRaw('LOWER(city) = ?', [mb_strtolower($city)]);
            })
            ->when($filters['property_type'] ?? null, fn (Builder $query, string $type) => $query->where('property_type', $type))
            ->when($rentalType, function (Builder $query, string $rentalType) {
                // A property listed as "both" satisfies a search for
                // either short_term or long_term specifically, since it
                // does offer that rental mode.
                $query->where(
                    fn (Builder $sub) => $rentalType === RentalType::Both->value
                        ? $sub->where('rental_type', RentalType::Both->value)
                        : $sub->whereIn('rental_type', [$rentalType, RentalType::Both->value])
                );
            })
            ->when(isset($filters['bedrooms']), fn (Builder $query) => $query->where('bedrooms', '>=', $filters['bedrooms']))
            ->when(isset($filters['bathrooms']), fn (Builder $query) => $query->where('bathrooms', '>=', $filters['bathrooms']))
            ->when($maxGuests !== null, fn (Builder $query) => $query->where('max_guests', '>=', $maxGuests))
            // Which column "price" means is decided once, above, in
            // $priceColumn: sale_price for a sale search, price_per_month
            // for a long_term search, price_per_night for everything else.
            ->when(isset($filters['min_price']), fn (Builder $query) => $query->where($priceColumn, '>=', $filters['min_price']))
            ->when(isset($filters['max_price']), fn (Builder $query) => $query->where($priceColumn, '<=', $filters['max_price']))
            ->when($filters['amenities'] ?? null, function (Builder $query, array $amenityIds) {
                // Must have ALL requested amenities, not just one - one
                // whereHas() per id, each narrowing the result further.
                foreach ($amenityIds as $amenityId) {
                    $query->whereHas('amenities', fn (Builder $sub) => $sub->where('amenities.id', $amenityId));
                }
            })
            ->with([
                'owner:id,name,avatar_path',
                // Only the cover image, not the full gallery — list cards
                // just need one thumbnail. The full gallery is loaded
                // separately in show() for the property details page.
                // No Builder type-hint here on purpose: eager-load
                // constraint closures for a hasMany relation receive a
                // Relations\HasMany instance, not a plain Builder — a
                // strict Builder type-hint throws a TypeError.
                'images' => fn ($query) => $query->where('is_cover', true),
            ])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            // Price sort. "IS NULL" first pushes listings that have no price
            // in this column (for example a long-term-only rental when
            // sorting nightly prices) to the END, whatever the direction —
            // otherwise MySQL would put them first on an ascending sort.
            // Newest first is always the tie-break, and the default.
            ->when(
                in_array($sort, ['price_asc', 'price_desc'], true),
                fn (Builder $query) => $query
                    ->orderByRaw("{$priceColumn} IS NULL")
                    ->orderBy($priceColumn, $sort === 'price_asc' ? 'asc' : 'desc')
            )
            ->latest('published_at')
            ->paginate($perPage);
    }

    public function paginateForOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return Property::query()
            ->where('owner_id', $ownerId)
            // Same eager-loading as paginatePublished(), minus the owner
            // relation - the owner already knows it's them.
            ->with([
                'images' => fn ($query) => $query->where('is_cover', true),
            ])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->latest()
            ->paginate($perPage);
    }

    public function create(array $attributes): Property
    {
        return Property::create($attributes);
    }

    public function update(Property $property, array $attributes): Property
    {
        $property->update($attributes);

        return $property->fresh();
    }

    public function delete(Property $property): bool
    {
        return (bool) $property->delete();
    }

    public function slugExists(string $slug, ?int $ignoreId = null): bool
    {
        return Property::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists();
    }

    public function syncAmenities(Property $property, array $amenityIds): void
    {
        $property->amenities()->sync($amenityIds);
    }

    public function createImages(Property $property, array $rows): Collection
    {
        return $property->images()->createMany($rows);
    }

    public function deleteImage(PropertyImage $image): bool
    {
        return (bool) $image->delete();
    }
}
