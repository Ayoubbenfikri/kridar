<?php

namespace App\Repositories\Eloquent;

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
        return Property::query()
            ->where('status', PropertyStatus::Published)
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
            ->when($filters['rental_type'] ?? null, function (Builder $query, string $rentalType) {
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
            ->when(isset($filters['max_guests']), fn (Builder $query) => $query->where('max_guests', '>=', $filters['max_guests']))
            ->when(isset($filters['min_price']) || isset($filters['max_price']), function (Builder $query) use ($filters) {
                // Which column depends on what's being searched: a
                // long_term search compares price_per_month, everything
                // else (short_term, both, or no rental_type given at all)
                // compares price_per_night.
                $column = ($filters['rental_type'] ?? null) === RentalType::LongTerm->value
                    ? 'price_per_month'
                    : 'price_per_night';

                $query
                    ->when(isset($filters['min_price']), fn (Builder $q) => $q->where($column, '>=', $filters['min_price']))
                    ->when(isset($filters['max_price']), fn (Builder $q) => $q->where($column, '<=', $filters['max_price']));
            })
            ->when($filters['amenities'] ?? null, function (Builder $query, array $amenityIds) {
                // Must have ALL requested amenities, not just one - one
                // whereHas() per id, each narrowing the result further.
                foreach ($amenityIds as $amenityId) {
                    $query->whereHas('amenities', fn (Builder $sub) => $sub->where('amenities.id', $amenityId));
                }
            })
            ->with([
                'owner:id,name',
                // Only the cover image, not the full gallery — list cards
                // just need one thumbnail. The full gallery is loaded
                // separately in show() for the property details page.
                // No Builder type-hint here on purpose: eager-load
                // constraint closures for a hasMany relation receive a
                // Relations\HasMany instance, not a plain Builder — a
                // strict Builder type-hint throws a TypeError.
                'images' => fn ($query) => $query->where('is_cover', true),
            ])
            ->latest('published_at')
            ->paginate($perPage);
    }

    public function paginateForOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return Property::query()
            ->where('owner_id', $ownerId)
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
