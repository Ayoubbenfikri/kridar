<?php

namespace App\Repositories\Contracts;

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PropertyRepositoryInterface
{
    /**
     * Published properties only, newest first, narrowed by whichever
     * filters are present (see PropertySearchRequest for the accepted
     * keys). Every filter is optional — an empty array behaves exactly
     * like the unfiltered Phase 5 listing.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginatePublished(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Every price (in the column a search of this kind compares) of the
     * published properties, ascending - the raw material of the price
     * histogram. Same price-column rule as paginatePublished(): sale_price
     * for a sale, price_per_month for a long_term rental, price_per_night
     * otherwise. Listings without a price in that column are left out.
     *
     * @return array<int, float>
     */
    public function publishedPrices(string $listingType, ?string $rentalType = null): array;

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

    /**
     * Bulk-insert image rows for a property. Each row must already contain
     * 'path', 'is_cover' and 'sort_order'.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return Collection<int, PropertyImage>
     */
    public function createImages(Property $property, array $rows): Collection;

    public function deleteImage(PropertyImage $image): bool;
}
