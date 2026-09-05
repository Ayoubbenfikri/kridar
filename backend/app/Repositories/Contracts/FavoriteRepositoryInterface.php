<?php

namespace App\Repositories\Contracts;

use App\Models\Favorite;
use Illuminate\Pagination\LengthAwarePaginator;

interface FavoriteRepositoryInterface
{
    /**
     * Properties favorited by this user, most recently favorited first.
     */
    public function paginatePropertiesForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function firstOrCreate(int $userId, int $propertyId): Favorite;

    /**
     * @return bool whether a row was actually deleted (false if it wasn't favorited)
     */
    public function delete(int $userId, int $propertyId): bool;
}
