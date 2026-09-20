<?php

namespace Tests\Feature\Pricing;

use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use App\Services\SettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The promise Kridar makes to owners: the commission agreed when a
 * booking was made is the commission that applies to it, forever.
 *
 * An admin can change the rate at any time from /admin/settings. If the
 * rate were read at display time instead of snapshotted at booking
 * time, that change would silently rewrite what every past owner was
 * owed — which is the kind of bug nobody notices until an owner does
 * the arithmetic themselves.
 */
class CommissionSnapshotTest extends TestCase
{
    use RefreshDatabase;

    private function setCommissionRate(float $rate): void
    {
        app(SettingService::class)->update([SettingService::COMMISSION_RATE => $rate]);
    }

    /**
     * @return array{0: User, 1: Property}
     */
    private function ownerWithProperty(): array
    {
        $owner = User::factory()->create();

        $property = Property::factory()
            ->shortTerm()
            ->for($owner, 'owner')
            ->create(['price_per_night' => 500, 'max_guests' => 4]);

        return [$owner, $property];
    }

    /**
     * @return array<string, mixed>
     */
    private function book(Property $property, int $startInDays, int $nights): array
    {
        return $this->postJson('/api/v1/reservations', [
            'property_id' => $property->id,
            'rental_type' => 'short_term',
            'start_date' => now()->addDays($startInDays)->toDateString(),
            'end_date' => now()->addDays($startInDays + $nights)->toDateString(),
            'guests_count' => 2,
        ])->assertCreated()->json('reservation');
    }

    public function test_the_commission_is_stored_on_the_reservation(): void
    {
        $this->setCommissionRate(10);
        [, $property] = $this->ownerWithProperty();

        Sanctum::actingAs(User::factory()->create());

        $reservation = $this->book($property, 7, 2);

        // 2 nights x 500 = 1000. Decimal columns come back as strings.
        $this->assertSame('1000.00', $reservation['total_price']);
        $this->assertSame('10.00', $reservation['commission_rate']);
        $this->assertSame('100.00', $reservation['commission_amount']);
        $this->assertSame('900.00', $reservation['owner_amount']);
    }

    public function test_changing_the_rate_does_not_rewrite_an_existing_reservation(): void
    {
        $this->setCommissionRate(10);
        [, $property] = $this->ownerWithProperty();

        Sanctum::actingAs(User::factory()->create());

        $first = $this->book($property, 7, 2);
        $this->assertSame('100.00', $first['commission_amount']);

        // The admin doubles the commission.
        $this->setCommissionRate(20);

        // The booking already agreed is untouched...
        $stored = Reservation::findOrFail($first['id']);
        $this->assertSame('10.00', $stored->commission_rate);
        $this->assertSame('100.00', $stored->commission_amount);
        $this->assertSame('900.00', $stored->owner_amount);

        // ...while a new booking picks up the new rate.
        $second = $this->book($property, 30, 2);
        $this->assertSame('20.00', $second['commission_rate']);
        $this->assertSame('200.00', $second['commission_amount']);
        $this->assertSame('800.00', $second['owner_amount']);
    }

    public function test_a_long_term_reservation_carries_no_commission(): void
    {
        $this->setCommissionRate(20);

        $owner = User::factory()->create();
        $property = Property::factory()
            ->longTerm()
            ->for($owner, 'owner')
            ->create(['price_per_month' => 4000]);

        Sanctum::actingAs(User::factory()->create());

        // A long-term booking must be at least one month
        // (StoreReservationRequest::after).
        $reservation = $this->postJson('/api/v1/reservations', [
            'property_id' => $property->id,
            'rental_type' => 'long_term',
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(7 + 31)->toDateString(),
        ])->assertCreated()->json('reservation');

        $this->assertSame('0.00', $reservation['commission_rate']);
        $this->assertSame('0.00', $reservation['commission_amount']);
        // The owner receives the rent in full — Kridar never touches it.
        $this->assertSame($reservation['total_price'], $reservation['owner_amount']);
    }

    public function test_the_price_preview_matches_what_gets_stored(): void
    {
        // The preview exists so the guest sees the real amount before
        // committing. If it ever disagreed with the reservation, the
        // guest would be quoted one price and charged another.
        $this->setCommissionRate(15);
        [, $property] = $this->ownerWithProperty();

        Sanctum::actingAs(User::factory()->create());

        $preview = $this->postJson('/api/v1/reservations/price-preview', [
            'property_id' => $property->id,
            'rental_type' => 'short_term',
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(9)->toDateString(),
        ])->assertOk()->json('pricing');

        $reservation = $this->book($property, 7, 2);

        $this->assertSame(
            number_format($preview['total_price'], 2, '.', ''),
            $reservation['total_price'],
        );
        $this->assertSame(
            number_format($preview['commission_amount'], 2, '.', ''),
            $reservation['commission_amount'],
        );
        $this->assertSame(
            number_format($preview['owner_amount'], 2, '.', ''),
            $reservation['owner_amount'],
        );
    }
}
