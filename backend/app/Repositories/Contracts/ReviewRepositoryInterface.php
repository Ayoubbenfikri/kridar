<?php

namespace App\Repositories\Contracts;

use App\Models\Review;
use Illuminate\Pagination\LengthAwarePaginator;

interface ReviewRepositoryInterface
{
    public function paginateForProperty(int $propertyId, int $perPage = 15): LengthAwarePaginator;

    public function create(array $attributes): Review;

    public function update(Review $review, array $attributes): Review;
}
