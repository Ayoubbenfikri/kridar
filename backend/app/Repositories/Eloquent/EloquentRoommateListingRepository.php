<?php

namespace App\Repositories\Eloquent;

use App\Enums\RoommateListingStatus;
use App\Models\RoommateListing;
use App\Models\RoommateListingImage;
use App\Repositories\Contracts\RoommateListingRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentRoommateListingRepository implements RoommateListingRepositoryInterface
{
    public function paginatePublished(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return RoommateListing::query()
            ->where('status', RoommateListingStatus::Published)
            ->when($filters['q'] ?? null, function (Builder $query, string $q) {
                // Same free-text convention as EloquentPropertyRepository:
                // title OR city contains the term.
                $query->where(function (Builder $sub) use ($q) {
                    $sub->where('title', 'like', "%{$q}%")
                        ->orWhere('city', 'like', "%{$q}%");
                });
            })
            ->when($filters['city'] ?? null, function (Builder $query, string $city) {
                $query->whereRaw('LOWER(city) = ?', [mb_strtolower($city)]);
            })
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when(isset($filters['min_price']) || isset($filters['max_price']), function (Builder $query) use ($filters) {
                $query
                    ->when(isset($filters['min_price']), fn (Builder $q) => $q->where('price_per_person', '>=', $filters['min_price']))
                    ->when(isset($filters['max_price']), fn (Builder $q) => $q->where('price_per_person', '<=', $filters['max_price']));
            })
            ->when(isset($filters['beds']), fn (Builder $query) => $query->where('beds', '>=', $filters['beds']))
            ->when(isset($filters['bedrooms']), fn (Builder $query) => $query->where('bedrooms', '>=', $filters['bedrooms']))
            ->when(array_key_exists('furnished', $filters) && $filters['furnished'] !== null, fn (Builder $query) => $query->where('furnished', $filters['furnished']))
            ->when($filters['available_by'] ?? null, function (Builder $query, string $date) {
                // "I need to move in by this date" — a listing with no
                // available_from set is treated as available any time,
                // so it still matches.
                $query->where(function (Builder $sub) use ($date) {
                    $sub->whereNull('available_from')
                        ->orWhere('available_from', '<=', $date);
                });
            })
            ->with([
                'user:id,name',
                'images' => fn ($query) => $query->where('is_cover', true),
            ])
            ->latest('published_at')
            ->paginate($perPage);
    }

    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return RoommateListing::query()
            ->where('user_id', $userId)
            ->with([
                'images' => fn ($query) => $query->where('is_cover', true),
            ])
            ->latest()
            ->paginate($perPage);
    }

    public function create(array $attributes): RoommateListing
    {
        return RoommateListing::create($attributes);
    }

    public function update(RoommateListing $listing, array $attributes): RoommateListing
    {
        $listing->update($attributes);

        return $listing->fresh();
    }

    public function delete(RoommateListing $listing): bool
    {
        return (bool) $listing->delete();
    }

    public function createImages(RoommateListing $listing, array $rows): Collection
    {
        return $listing->images()->createMany($rows);
    }

    public function deleteImage(RoommateListingImage $image): bool
    {
        return (bool) $image->delete();
    }
}
