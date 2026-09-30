<?php

namespace App\Repositories\Contracts;

use App\Models\RoommateListing;
use App\Models\RoommateListingImage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface RoommateListingRepositoryInterface
{
    /**
     * Published posts only, newest first, narrowed by whichever filters
     * are present (see RoommateListingSearchRequest for the accepted
     * keys). Every filter is optional.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginatePublished(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Every post by one user, any status — their own "my posts" screen,
     * not exposed publicly. Mirrors PropertyRepositoryInterface::paginateForOwner().
     */
    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function create(array $attributes): RoommateListing;

    public function update(RoommateListing $listing, array $attributes): RoommateListing;

    public function delete(RoommateListing $listing): bool;

    /**
     * Bulk-insert image rows. Each row must already contain 'path',
     * 'is_cover' and 'sort_order' — mirrors
     * PropertyRepositoryInterface::createImages().
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return Collection<int, RoommateListingImage>
     */
    public function createImages(RoommateListing $listing, array $rows): Collection;

    public function deleteImage(RoommateListingImage $image): bool;
}
