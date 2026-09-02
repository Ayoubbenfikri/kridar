<?php

namespace Database\Factories;

use App\Enums\ReservationStatus;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 *
 * Note: this factory does NOT run the real availability/pricing logic from
 * AvailabilityService/PricingService (those don't exist until Phase 8) — it
 * just fabricates plausible rows for testing the schema and seeding demo data.
 */
class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('+1 week', '+2 months');
        $nights = fake()->numberBetween(2, 10);
        $end = (clone $start)->modify("+{$nights} days");
        $unitPrice = fake()->numberBetween(200, 1500);

        return [
            'property_id' => Property::factory(),
            'guest_id' => User::factory(),
            'rental_type' => 'short_term',
            'start_date' => $start,
            'end_date' => $end,
            'unit_price' => $unitPrice,
            'total_price' => $unitPrice * $nights,
            'guests_count' => fake()->numberBetween(1, 4),
            'status' => ReservationStatus::Pending,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Confirmed,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Completed,
            'start_date' => fake()->dateTimeBetween('-2 months', '-1 month'),
            'end_date' => fake()->dateTimeBetween('-1 month', '-1 week'),
        ]);
    }
}
