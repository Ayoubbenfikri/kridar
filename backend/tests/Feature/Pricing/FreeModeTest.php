<?php

namespace Tests\Feature\Pricing;

use App\Enums\PropertyStatus;
use App\Enums\RentalType;
use App\Models\Property;
use App\Models\User;
use App\Services\PricingService;
use App\Services\PropertyService;
use App\Services\SettingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Free mode — Kridar charging for nothing (Phase 28).
 *
 * The rest of tests/Feature/Pricing covers the PAID model, because
 * phpunit.xml pins PAYMENTS_ENABLED=true so that dormant work stays
 * covered. This file is the other half: every test here flips the flag
 * off first, so both modes are verified and neither depends on how the
 * file happens to be configured.
 *
 * What is being protected is the SWITCH itself. Turning a business model
 * off by hand tends to leave one gate behind — and the gate you forget is
 * the one that quietly charges someone, or blocks a listing that owes
 * nothing.
 *
 * Where a behaviour lives in a service, these call the service rather
 * than the HTTP endpoint. Not laziness: StorePropertyRequest and
 * StoreReservationRequest have long rule lists, and a test that fails
 * because it sent 8 of 11 required fields tells you nothing about free
 * mode.
 */
class FreeModeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Not in a per-test helper: every assertion in this file is about
        // the platform being free, so it belongs where it cannot be
        // forgotten.
        config()->set('payments.enabled', false);
    }

    private function unpaidLongTermDraft(?User $owner = null): Property
    {
        return Property::factory()
            ->longTerm()
            ->unpaidPublication()
            ->draft()
            ->for($owner ?? User::factory()->create(), 'owner')
            ->create();
    }

    // ---------------------------------------------------------------
    // Publishing is free
    // ---------------------------------------------------------------

    public function test_a_long_term_listing_publishes_without_paying_anything(): void
    {
        // THE test. In paid mode this exact listing is refused with a 402
        // (see PublicationFeeTest) — it appears in long-term search and has
        // never paid its fee. Free mode means it just goes live.
        $owner = User::factory()->create();
        $property = $this->unpaidLongTermDraft($owner);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/properties/{$property->id}/publish")->assertOk();

        $this->assertSame(PropertyStatus::Published, $property->fresh()->status);
    }

    public function test_the_fee_gate_reports_nothing_owed(): void
    {
        // The single line that switches the model. Every caller asks this
        // one method rather than re-testing rental_type, so if it is right
        // here it is right in PropertyService::publish() and ::update().
        $property = $this->unpaidLongTermDraft();

        $this->assertFalse($property->isBlockedByPublicationFee());

        // The underlying fact is unchanged: this listing IS a long-term
        // one. Free mode means no fee is charged, not that the listing
        // changed shape.
        $this->assertTrue($property->requiresPublicationFee());
    }

    public function test_the_gate_comes_back_when_payments_are_switched_on(): void
    {
        // The flag has to work in both directions, or "we can turn it back
        // on later" is a promise nothing checks.
        $property = $this->unpaidLongTermDraft();

        config()->set('payments.enabled', true);

        $this->assertTrue($property->isBlockedByPublicationFee());
    }

    public function test_editing_a_published_listing_does_not_knock_it_back_to_draft(): void
    {
        // PropertyService::update() demotes a published listing to draft
        // when it starts owing a fee — the Phase 22 back door, where an
        // owner published as short-term then switched to long-term for
        // free. With no fee to owe, that demotion must not fire, or every
        // edit would silently unpublish the listing.
        $property = Property::factory()->shortTerm()->create();

        app(PropertyService::class)->update($property, [
            'rental_type' => RentalType::LongTerm->value,
            'price_per_month' => 6000,
        ]);

        $fresh = $property->fresh();

        $this->assertSame(RentalType::LongTerm, $fresh->rental_type);
        $this->assertSame(PropertyStatus::Published, $fresh->status);
    }

    // ---------------------------------------------------------------
    // Bookings take no commission
    // ---------------------------------------------------------------

    public function test_a_short_term_booking_is_priced_with_zero_commission(): void
    {
        // This is the one with teeth. The rate is SNAPSHOTTED onto the
        // reservation by ReservationService, so if PricingService returned
        // the stored 10% while the platform is free, real bookings would
        // carry a commission nobody collects — and the owner's dashboard
        // would understate what they are owed, permanently, on rows
        // already written.
        $property = Property::factory()->shortTerm()->create(['price_per_night' => 500]);

        $pricing = app(PricingService::class)->calculate(
            $property,
            RentalType::ShortTerm,
            Carbon::parse('2026-10-01'),
            Carbon::parse('2026-10-04'),
        );

        $this->assertSame(1500.0, $pricing['total_price']);
        $this->assertSame(0.0, $pricing['commission_rate']);
        $this->assertSame(0.0, $pricing['commission_amount']);

        // The owner gets the whole thing.
        $this->assertSame(1500.0, $pricing['owner_amount']);
    }

    public function test_the_stored_commission_rate_is_left_alone(): void
    {
        // Free mode overrides the rate at read time; it does not erase the
        // admin's setting. Whatever was configured has to still be there
        // when payments come back on.
        config()->set('payments.enabled', true);

        $this->assertGreaterThan(0, app(SettingService::class)->commissionRate());
    }

    // ---------------------------------------------------------------
    // Nothing can be paid, even on purpose
    // ---------------------------------------------------------------

    public function test_starting_a_publication_payment_is_refused(): void
    {
        // The frontend hides every pay button in free mode, which is
        // exactly why this matters: a hidden button is not a rule. A stale
        // tab or a bookmarked URL can still POST here, and without the
        // guard this would create a payment row AND publish the listing as
        // a side effect.
        $owner = User::factory()->create();
        $property = $this->unpaidLongTermDraft($owner);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/properties/{$property->id}/publication-payment")
            ->assertStatus(409);

        $this->assertDatabaseCount('payments', 0);
        $this->assertSame(PropertyStatus::Draft, $property->fresh()->status);
    }

    // ---------------------------------------------------------------
    // The frontend is told, rather than guessing
    // ---------------------------------------------------------------

    public function test_the_public_settings_endpoint_announces_free_mode(): void
    {
        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('settings.payments_enabled', false);
    }

    public function test_the_settings_endpoint_still_reports_the_configured_prices(): void
    {
        // Deliberate: the admin's fee and rate are still published while
        // inactive, so /admin/settings can show what WILL apply when
        // payments are switched back on.
        $settings = $this->getJson('/api/v1/settings')->assertOk()->json('settings');

        $this->assertArrayHasKey('listing_publication_fee', $settings);
        $this->assertArrayHasKey('short_term_commission_rate', $settings);
    }

    public function test_a_listing_reports_no_fee_required(): void
    {
        // What actually makes the owner's pay button and the "unpaid"
        // badge disappear — no frontend condition, just an honest field.
        $property = $this->unpaidLongTermDraft();

        // An admin, because the listing is a draft and PropertyPolicy
        // only lets its owner or an admin view one.
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson("/api/v1/properties/{$property->id}")
            ->assertOk()
            ->assertJsonPath('property.requires_publication_fee', false);
    }

    public function test_support_methods_are_only_published_when_configured(): void
    {
        // An unset donation method must be ABSENT, not an empty string —
        // /support renders whatever keys arrive, so a blank one would draw
        // an empty row.
        config()->set('support.donate_url', null);
        config()->set('support.bank_details', 'RIB 000 111 222');

        $support = $this->getJson('/api/v1/settings')->assertOk()->json('support');

        $this->assertArrayNotHasKey('donate_url', $support);
        $this->assertSame('RIB 000 111 222', $support['bank_details']);
    }
}
