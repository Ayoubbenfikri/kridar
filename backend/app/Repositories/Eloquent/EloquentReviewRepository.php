<?php

namespace App\Repositories\Eloquent;

use App\Models\Review;
use App\Repositories\Contracts\ReviewRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentReviewRepository implements ReviewRepositoryInterface
{
    public function paginateForProperty(int $propertyId, int $perPage = 15): LengthAwarePaginator
    {
        return Review::query()
            ->where('property_id', $propertyId)
            ->with('guest:id,name')
            ->latest()
            ->paginate($perPage);
    }

    public function create(array $attributes): Review
    {
        return Review::create($attributes);
    }

    public function update(Review $review, array $attributes): Review
    {
        $review->update($attributes);

        return $review->fresh();
    }
}
