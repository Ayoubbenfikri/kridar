<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

/**
 * Reference data, not demo data — this always runs (unlike DemoDataSeeder)
 * because properties need real amenities to attach to from Phase 5 onward.
 */
class AmenitiesSeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [
            ['name' => 'WiFi', 'category' => 'connectivity'],
            ['name' => 'Air conditioning', 'category' => 'comfort'],
            ['name' => 'Heating', 'category' => 'comfort'],
            ['name' => 'Kitchen', 'category' => 'comfort'],
            ['name' => 'Washing machine', 'category' => 'comfort'],
            ['name' => 'Free parking', 'category' => 'practical'],
            ['name' => 'Elevator', 'category' => 'practical'],
            ['name' => 'Swimming pool', 'category' => 'outdoor'],
            ['name' => 'Terrace', 'category' => 'outdoor'],
            ['name' => 'Garden', 'category' => 'outdoor'],
            ['name' => 'TV', 'category' => 'entertainment'],
            ['name' => 'Security / guard', 'category' => 'safety'],
            ['name' => 'Smoke detector', 'category' => 'safety'],
            ['name' => 'Pets allowed', 'category' => 'policy'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::firstOrCreate(['name' => $amenity['name']], $amenity);
        }
    }
}
