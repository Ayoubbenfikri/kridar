<?php

namespace Tests\Feature\Pricing;

use App\Enums\PropertyStatus;
use App\Enums\PublicationStatus;
use App\Enums\RentalType;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The rule the whole long-term business model rests on: a listing that
 * appears in long-term search does not go live until its one-off
 * publication fee is paid.
 *
 * Everything here goes through the HTTP layer on purpose. The frontend
 * hides the publish button in this situation, but hiding a button is not
 * a rule — these tests prove the API refuses even when the button is
 * bypassed entirely.
 */
class PublicationFeeTest extends TestCase
{
    use RefreshDatabase;

    private function owner(): User
    {
        return User::factory()->create();
    }

    public function test_publishing_an_unpaid_long_term_listing_is_refused(): void
    {
        $owner = $this->owner();
        $property = Property::factory()
            ->longTerm()
            ->unpaidPublication()
            ->draft()
            ->for($owner, 'owner')
            ->create();

        Sanctum::actingAs($owner);

        // 402 Payment Required, not 409: the frontend needs to tell
        // "pay first and this works" apart from "you cannot do this".
        $this->patchJson("/api/v1/properties/{$property->id}/publish")
            ->assertStatus(402);

        $this->assertSame(PropertyStatus::Draft, $property->fresh()->status);
    }

    public function test_publishing_a_short_term_listing_is_free(): void
    {
        $owner = $this->owner();
        $property = Property::factory()
            ->shortTerm()
            ->draft()
            ->for($owner, 'owner')
            ->create();

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/properties/{$property->id}/publish")
            ->assertOk();

        $this->assertSame(PropertyStatus::Published, $property->fresh()->status);
    }

    public function test_a_both_listing_also_owes_the_fee(): void
    {
        // The whole point of the rule: 'both' reaches long-term seekers,
        // so it uses the paid service. Without this an owner ticks
        // "both" and gets long-term visibility for nothing.
        $owner = $this->owner();
        $property = Property::factory()
            ->draft()
            ->for($owner, 'owner')
            ->create([
                'rental_type' => RentalType::Both,
                'price_per_night' => 500,
                'price_per_month' => 4000,
                'max_guests' => 4,
                'publication_status' => null,
                'publication_paid_at' => null,
            ]);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/properties/{$property->id}/publish")
            ->assertStatus(402);
    }

    public function test_paying_the_fee_publishes_the_listing(): void
    {
        $owner = $this->owner();
        $property = Property::factory()
            ->longTerm()
            ->unpaidPublication()
            ->draft()
            ->for($owner, 'owner')
            ->create();

        Sanctum::actingAs($owner);

        $started = $this->postJson("/api/v1/properties/{$property->id}/publication-payment")
            ->assertCreated()
            ->json();

        $this->assertSame('listing_publication', $started['payment']['type']);
        $this->assertNotNull($started['redirect_url']);

        // The fake gateway settles on a plain GET to the return URL —
        // the same route PayPal sends the browser back to.
        $this->get("/api/v1/payments/{$started['payment']['id']}/return")
            ->assertRedirect();

        $property->refresh();
        $this->assertSame(PublicationStatus::Paid, $property->publication_status);
        $this->assertSame(PropertyStatus::Published, $property->status);
    }

    public function test_the_fee_cannot_be_paid_twice(): void
    {
        $owner = $this->owner();
        $property = Property::factory()
            ->longTerm()
            ->for($owner, 'owner')
            ->create(); // longTerm() leaves the fee already settled

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/properties/{$property->id}/publication-payment")
            ->assertStatus(409);
    }

    public function test_a_short_term_listing_has_no_fee_to_pay(): void
    {
        $owner = $this->owner();
        $property = Property::factory()->shortTerm()->for($owner, 'owner')->create();

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/properties/{$property->id}/publication-payment")
            ->assertStatus(409);
    }

    public function test_switching_a_published_listing_to_long_term_takes_it_offline(): void
    {
        // The back door: publish as short-term (free), then edit the
        // rental_type to reach paid long-term search for nothing.
        $owner = $this->owner();
        $property = Property::factory()
            ->shortTerm()
            ->for($owner, 'owner')
            ->create(); // published, no fee owed

        $this->assertSame(PropertyStatus::Published, $property->status);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/properties/{$property->id}", [
            'rental_type' => 'long_term',
            'price_per_month' => 4000,
        ])->assertOk();

        $property->refresh();
        $this->assertSame(PropertyStatus::Draft, $property->status);
        $this->assertFalse($property->publicationFeePaid());
    }

    public function test_an_admin_can_publish_without_the_fee(): void
    {
        // Deliberate override: cash taken at the office, a goodwill
        // gesture. The fee stays recorded as unpaid so the revenue
        // figures do not claim money nobody sent.
        $admin = User::factory()->admin()->create();
        $property = Property::factory()
            ->longTerm()
            ->unpaidPublication()
            ->draft()
            ->create();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/properties/{$property->id}/approve")
            ->assertOk();

        $property->refresh();
        $this->assertSame(PropertyStatus::Published, $property->status);
        $this->assertFalse($property->publicationFeePaid());
    }
}
