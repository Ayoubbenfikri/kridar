<?php

namespace App\Repositories\Eloquent;

use App\Enums\RoommateListingStatus;
use App\Enums\RoommateListingType;
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
            // 'offer' posts have a single price_per_person figure — a
            // min/max_price filter compares straight against it. 'request'
            // posts store a budget RANGE instead (budget_min/budget_max,
            // see the 2026_10_01 migration), so a post matches when its
            // range OVERLAPS the filter's range — same interval-overlap
            // test AvailabilityService uses for dates. A post with only
            // one bound set still matches on its open side, same "null =
            // no limit" rule already used by every other filter here.
            ->when(isset($filters['min_price']) || isset($filters['max_price']), function (Builder $query) use ($filters) {
                $isRequest = ($filters['type'] ?? null) === RoommateListingType::Request->value;

                if ($isRequest) {
                    $query
                        ->when(isset($filters['min_price']), fn (Builder $q) => $q->where(
                            fn (Builder $sub) => $sub->whereNull('budget_max')->orWhere('budget_max', '>=', $filters['min_price']),
                        ))
                        ->when(isset($filters['max_price']), fn (Builder $q) => $q->where(
                            fn (Builder $sub) => $sub->whereNull('budget_min')->orWhere('budget_min', '<=', $filters['max_price']),
                        ));
                } else {
                    $query
                        ->when(isset($filters['min_price']), fn (Builder $q) => $q->where('price_per_person', '>=', $filters['min_price']))
                        ->when(isset($filters['max_price']), fn (Builder $q) => $q->where('price_per_person', '<=', $filters['max_price']));
                }
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
                'user:id,name,avatar_path',
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
