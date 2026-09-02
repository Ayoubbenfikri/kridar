<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Optional — sample users, properties and reservations so the API/frontend
 * has something to display while you build. Not run automatically by
 * DatabaseSeeder; run it explicitly when you want demo data:
 *
 *   php artisan db:seed --class=Database\\Seeders\\DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::factory()->create([
            'name' => 'Demo Owner',
            'email' => 'owner@kridar.test',
        ]);

        $guest = User::factory()->create([
            'name' => 'Demo Guest',
            'email' => 'guest@kridar.test',
        ]);

        User::factory()->admin()->create([
            'name' => 'Demo Admin',
            'email' => 'admin@kridar.test',
        ]);

        Property::factory()
            ->count(8)
            ->for($owner, 'owner')
            ->create()
            ->each(function (Property $property) use ($guest) {
                $property->amenities()->attach(
                    \App\Models\Amenity::inRandomOrder()->limit(random_int(3, 6))->pluck('id')
                );
            });
    }
}
