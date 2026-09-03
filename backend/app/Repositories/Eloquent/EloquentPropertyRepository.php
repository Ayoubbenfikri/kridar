<?php

namespace App\Repositories\Eloquent;

use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentPropertyRepository implements PropertyRepositoryInterface
{
    public function paginatePublished(int $perPage = 15): LengthAwarePaginator
    {
        return Property::query()
            ->where('status', PropertyStatus::Published)
            ->with(['owner:id,name'])
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
}
