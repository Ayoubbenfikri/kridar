<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Only reference data (amenities) runs by default. For sample
     * users/properties/reservations to develop against, run DemoDataSeeder
     * explicitly — see its docblock.
     */
    public function run(): void
    {
        $this->call(AmenitiesSeeder::class);
    }
}
