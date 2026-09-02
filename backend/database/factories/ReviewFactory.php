<?php

namespace Database\Factories;

use App\Models\Reservation;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory()->completed(),
            'property_id' => fn (array $attributes) => Reservation::find($attributes['reservation_id'])->property_id,
            'guest_id' => fn (array $attributes) => Reservation::find($attributes['reservation_id'])->guest_id,
            'rating' => fake()->numberBetween(3, 5),
            'comment' => fake()->paragraph(),
        ];
    }
}
