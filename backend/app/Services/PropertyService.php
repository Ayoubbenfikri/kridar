<?php

namespace App\Services;

use App\Enums\PropertyStatus;
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

    public function listPublished(int $perPage = 15): LengthAwarePaginator
    {
        return $this->properties->paginatePublished($perPage);
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

        return $property->load('amenities');
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

        return $property->load('amenities');
    }

    public function delete(Property $property): bool
    {
        return $this->properties->delete($property);
    }

    public function publish(Property $property): Property
    {
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
