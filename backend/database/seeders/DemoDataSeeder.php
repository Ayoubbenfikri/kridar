<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Optional — sample users, properties and reservations so the API/frontend
 * has something to display while you build. Not run automatically by
 * DatabaseSeeder; run it explicitly when you want demo data:
 *
 *   php artisan db:seed --class=DemoDataSeeder
 *
 * Accounts created (password for all three: "password", see UserFactory):
 *   owner@kridar.test  — owns every sample property
 *   guest@kridar.test  — plain user
 *   admin@kridar.test  — role=admin, sees /admin
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::factory()->create([
            'name' => 'Demo Owner',
            'email' => 'owner@kridar.test',
        ]);

        User::factory()->create([
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
            ->each(function (Property $property) {
                $property->amenities()->attach(
                    Amenity::inRandomOrder()->limit(random_int(3, 6))->pluck('id')
                );
            });

        // Phase 22 (pricing) — a listing deliberately left in the state
        // the whole long-term model hangs on: it appears in long-term
        // search, it is still a draft, and its publication fee has never
        // been paid. Publishing it must fail until the owner pays.
        Property::factory()
            ->longTerm()
            ->unpaidPublication()
            ->draft()
            ->for($owner, 'owner')
            ->create([
                'title' => 'Appartement longue duree - publication non payee',
                'slug' => 'appartement-longue-duree-publication-non-payee',
                'city' => 'Marrakech',
            ]);
    }
}
