<?php

namespace Tests\Feature\Pricing;

use App\Enums\RentalType;
use App\Models\Property;
use App\Services\PricingService;
use App\Services\SettingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The arithmetic every booking depends on.
 *
 * These live in tests/Feature rather than tests/Unit because
 * PricingService reads the commission rate through SettingService, which
 * reads the database — tests/Unit does not boot the application.
 */
class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private function pricing(): PricingService
    {
        return app(PricingService::class);
    }

    private function setCommissionRate(float $rate): void
    {
        app(SettingService::class)->update([SettingService::COMMISSION_RATE => $rate]);
    }

    public function test_short_term_price_is_nights_times_the_nightly_rate(): void
    {
        $property = Property::factory()->shortTerm()->create(['price_per_night' => 500]);

        $result = $this->pricing()->calculate(
            $property,
            RentalType::ShortTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-10-04'),
        );

        // 1 Oct -> 4 Oct is three NIGHTS, not four days.
        $this->assertSame(3, $result['units']);
        $this->assertSame(1500.0, $result['total_price']);
        $this->assertSame(500.0, $result['unit_price']);
    }

    public function test_short_term_commission_uses_the_configured_rate(): void
    {
        $this->setCommissionRate(10);
        $property = Property::factory()->shortTerm()->create(['price_per_night' => 500]);

        $result = $this->pricing()->calculate(
            $property,
            RentalType::ShortTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-10-04'),
        );

        $this->assertSame(10.0, $result['commission_rate']);
        $this->assertSame(150.0, $result['commission_amount']);
        $this->assertSame(1350.0, $result['owner_amount']);
    }

    public function test_changing_the_rate_changes_what_a_new_calculation_returns(): void
    {
        $property = Property::factory()->shortTerm()->create(['price_per_night' => 500]);

        $this->setCommissionRate(10);
        $before = $this->pricing()->calculate(
            $property,
            RentalType::ShortTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-10-03'),
        );

        $this->setCommissionRate(25);
        $after = $this->pricing()->calculate(
            $property,
            RentalType::ShortTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-10-03'),
        );

        $this->assertSame(100.0, $before['commission_amount']);
        $this->assertSame(250.0, $after['commission_amount']);
    }

    public function test_long_term_is_billed_in_whole_months_rounding_up(): void
    {
        $property = Property::factory()->longTerm()->create(['price_per_month' => 4000]);

        // 45 days. A month and a half is billed as two whole months —
        // the standard practice for a lease.
        $result = $this->pricing()->calculate(
            $property,
            RentalType::LongTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-11-15'),
        );

        $this->assertSame(2, $result['units']);
        $this->assertSame(8000.0, $result['total_price']);
    }

    public function test_long_term_never_carries_a_commission(): void
    {
        // Even with a rate configured: Kridar's long-term income is the
        // one-off publication fee, never a cut of the rent.
        $this->setCommissionRate(30);
        $property = Property::factory()->longTerm()->create(['price_per_month' => 4000]);

        $result = $this->pricing()->calculate(
            $property,
            RentalType::LongTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-11-01'),
        );

        $this->assertSame(0.0, $result['commission_rate']);
        $this->assertSame(0.0, $result['commission_amount']);
        $this->assertSame($result['total_price'], $result['owner_amount']);
    }

    public function test_the_split_always_adds_back_up_to_the_total(): void
    {
        // Deliberately awkward numbers: 333.33 x 3 = 999.99, and 7.5% of
        // that is 74.99925 — a value that has to round. owner_amount is
        // computed by SUBTRACTION for exactly this reason; computing it
        // from the rate a second time would lose a centime here.
        $this->setCommissionRate(7.5);
        $property = Property::factory()->shortTerm()->create(['price_per_night' => 333.33]);

        $result = $this->pricing()->calculate(
            $property,
            RentalType::ShortTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-10-04'),
        );

        $this->assertSame(999.99, $result['total_price']);
        $this->assertSame(75.0, $result['commission_amount']);
        $this->assertSame(924.99, $result['owner_amount']);
        $this->assertSame(
            $result['total_price'],
            round($result['commission_amount'] + $result['owner_amount'], 2),
        );
    }

    public function test_a_zero_commission_rate_leaves_the_whole_total_to_the_owner(): void
    {
        $this->setCommissionRate(0);
        $property = Property::factory()->shortTerm()->create(['price_per_night' => 500]);

        $result = $this->pricing()->calculate(
            $property,
            RentalType::ShortTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-10-03'),
        );

        $this->assertSame(0.0, $result['commission_amount']);
        $this->assertSame(1000.0, $result['owner_amount']);
    }
}
