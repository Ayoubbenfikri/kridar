<?php

namespace App\Repositories\Contracts;

use App\Models\Property;
use Illuminate\Pagination\LengthAwarePaginator;

interface PropertyRepositoryInterface
{
    /**
     * Published properties only, newest first — what the public listing shows.
     */
    public function paginatePublished(int $perPage = 15): LengthAwarePaginator;

    /**
     * All properties owned by a given user, any status — for the owner's
     * own "my listings" screen (Phase 12), not exposed publicly.
     */
    public function paginateForOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator;

    public function create(array $attributes): Property;

    public function update(Property $property, array $attributes): Property;

    public function delete(Property $property): bool;

    public function slugExists(string $slug, ?int $ignoreId = null): bool;

    public function syncAmenities(Property $property, array $amenityIds): void;
}
