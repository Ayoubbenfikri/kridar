<?php

namespace App\Services;

use App\Models\Favorite;
use App\Models\Property;
use App\Models\User;
use App\Repositories\Contracts\FavoriteRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class FavoriteService
{
    public function __construct(
        private readonly FavoriteRepositoryInterface $favorites,
    ) {}

    public function listForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $this->favorites->paginatePropertiesForUser($user->id, $perPage);
    }

    /**
     * Idempotent — favoriting an already-favorited property just returns
     * the existing row rather than erroring. A "save" button doesn't
     * need a conflict error for clicking twice.
     */
    public function add(User $user, Property $property): Favorite
    {
        return $this->favorites->firstOrCreate($user->id, $property->id);
    }

    /**
     * Idempotent too — removing a property that was never favorited
     * just does nothing, no error.
     */
    public function remove(User $user, Property $property): void
    {
        $this->favorites->delete($user->id, $property->id);
    }
}
