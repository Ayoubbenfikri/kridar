<?php

namespace Database\Factories;

use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Enums\PublicationStatus;
use App\Enums\RentalType;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    protected $model = Property::class;

    /**
     * Cities kept short and Morocco-specific on purpose — Kridar doesn't
     * have a normalized cities table (see architecture doc, section 4),
     * so this is just realistic sample data, not a fixed list to validate against.
     */
    private const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Essaouira', 'Chefchaouen'];

    public function definition(): array
    {
        $title = fake()->randomElement([
            'Cozy apartment in the medina',
            'Modern studio near the beach',
            'Spacious villa with pool',
            'Traditional riad with courtyard',
            'Downtown office space',
        ]).' — '.fake()->streetName();

        $rentalType = fake()->randomElement(RentalType::cases());

        // Phase 29: whether a listing owes the fee is now a per-OWNER
        // history question (PropertyService::create()), not a
        // rental_type one, and factories bypass that service entirely.
        // A seeded listing is therefore just created already settled,
        // whatever its rental_type — otherwise the sample data would be
        // in a state PropertyService::publish() refuses to produce. Use
        // ->unpaidPublication() for the opposite case.
        return [
            'owner_id' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->paragraphs(3, true),
            'property_type' => fake()->randomElement(PropertyType::cases()),
            'rental_type' => $rentalType,
            'address' => fake()->streetAddress(),
            'city' => fake()->randomElement(self::CITIES),
            'region' => null,
            'country' => 'Morocco',
            'latitude' => fake()->latitude(27, 36),
            'longitude' => fake()->longitude(-13, -1),
            'bedrooms' => fake()->numberBetween(1, 5),
            'bathrooms' => fake()->numberBetween(1, 3),
            'max_guests' => $rentalType !== RentalType::LongTerm ? fake()->numberBetween(1, 10) : null,
            'area_sqm' => fake()->numberBetween(30, 300),
            'price_per_night' => $rentalType !== RentalType::LongTerm ? fake()->numberBetween(200, 2000) : null,
            'price_per_month' => $rentalType !== RentalType::ShortTerm ? fake()->numberBetween(2500, 25000) : null,
            'currency' => 'MAD',
            'status' => PropertyStatus::Published,
            'is_featured' => false,
            'published_at' => now(),
            'publication_status' => PublicationStatus::Paid,
            'publication_paid_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PropertyStatus::Draft,
            'published_at' => null,
        ]);
    }

    /**
     * A long-term-only listing, fee already settled (Phase 29: the fee
     * itself no longer depends on rental_type, but this state is kept for
     * every existing test that wants "a long-term listing" specifically).
     * Combine with ->unpaidPublication() for the "must pay first" case.
     */
    public function longTerm(): static
    {
        return $this->state(fn (array $attributes) => [
            'rental_type' => RentalType::LongTerm,
            'max_guests' => null,
            'price_per_night' => null,
            'price_per_month' => fake()->numberBetween(2500, 25000),
            'publication_status' => PublicationStatus::Paid,
            'publication_paid_at' => now(),
        ]);
    }

    public function shortTerm(): static
    {
        return $this->state(fn (array $attributes) => [
            'rental_type' => RentalType::ShortTerm,
            'max_guests' => fake()->numberBetween(1, 10),
            'price_per_night' => fake()->numberBetween(200, 2000),
            'price_per_month' => null,
            'publication_status' => PublicationStatus::Paid,
            'publication_paid_at' => now(),
        ]);
    }

    /**
     * Phase 29: the fee is owed and has never been paid — this is the
     * ADDITIONAL-listing case now, not a rental_type one, but the state
     * name is kept since every caller reads the same way: "this property
     * still needs its fee paid before it can publish". Combine with any
     * rental_type state, later states win:
     *
     *   Property::factory()->longTerm()->unpaidPublication()->draft()
     */
    public function unpaidPublication(): static
    {
        return $this->state(fn (array $attributes) => [
            'publication_status' => PublicationStatus::PendingPayment,
            'publication_paid_at' => null,
        ]);
    }
}
