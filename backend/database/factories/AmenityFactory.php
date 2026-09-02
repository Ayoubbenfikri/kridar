<?php

namespace Database\Factories;

use App\Models\Amenity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Amenity>
 */
class AmenityFactory extends Factory
{
    protected $model = Amenity::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'icon' => null,
            'category' => null,
        ];
    }
}
