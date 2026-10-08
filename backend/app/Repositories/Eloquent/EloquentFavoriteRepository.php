<?php

namespace App\Repositories\Eloquent;

use App\Enums\PropertyStatus;
use App\Models\Favorite;
use App\Models\Property;
use App\Repositories\Contracts\FavoriteRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentFavoriteRepository implements FavoriteRepositoryInterface
{
    public function paginatePropertiesForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Property::query()
            ->join('favorites', 'favorites.property_id', '=', 'properties.id')
            ->where('favorites.user_id', $userId)
            // Security audit (Oct 2026): a favorite stays in the table when
            // its listing is later unpublished or suspended, but the list
            // only ever shows what the user may still see — a published
            // listing, or one of their own. Same rule as PropertyPolicy::view.
            ->where(fn ($query) => $query
                ->where('properties.status', PropertyStatus::Published)
                ->orWhere('properties.owner_id', $userId))
            ->select('properties.*')
            ->with([
                'owner:id,name',
                // Only the cover image, same as the published listing —
                // this is a card grid, not the details page.
                'images' => fn ($query) => $query->where('is_cover', true),
            ])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->orderByDesc('favorites.created_at')
            ->paginate($perPage);
    }

    public function firstOrCreate(int $userId, int $propertyId): Favorite
    {
        return Favorite::firstOrCreate([
            'user_id' => $userId,
            'property_id' => $propertyId,
        ]);
    }

    public function delete(int $userId, int $propertyId): bool
    {
        return (bool) Favorite::where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->delete();
    }
}
