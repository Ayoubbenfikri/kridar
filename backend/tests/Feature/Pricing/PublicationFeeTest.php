<?php

namespace Tests\Feature\Pricing;

use App\Enums\PropertyStatus;
use App\Enums\PublicationStatus;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 29 (monetization overhaul) — the listing publication fee is no
 * longer a rental_type rule. Every owner's FIRST-EVER listing is free,
 * whatever kind it is; every one after that owes the fee
 * (SettingService::LISTING_FEE, 10 MAD by default) before it can publish.
 *
 * "Non-refundable on delete" is the rule with the sharpest teeth: the
 * free slot is spent the moment the first listing is CREATED
 * (User::has_used_free_listing), never restored — deleting that listing
 * must not hand out a second free one.
 *
 * Everything here goes through the HTTP layer on purpose. The frontend
 * hides the publish/pay buttons appropriately, but hiding a button is not
 * a rule — these tests prove the API refuses even when the button is
 * bypassed entirely.
 */
class PublicationFeeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function validPropertyPayload(string $rentalType = 'short_term'): array
    {
        return [
            'title' => 'A lovely place to stay',
            'description' => str_repeat('Lorem ipsum dolor sit amet. ', 3),
            'property_type' => 'apartment',
            'rental_type' => $rentalType,
            'address' => '12 Rue Example',
            'city' => 'Marrakech',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'max_guests' => in_array($rentalType, ['short_term', 'both'], true) ? 4 : null,
            'price_per_night' => in_array($rentalType, ['short_term', 'both'], true) ? 500 : null,
            'price_per_month' => in_array($rentalType, ['long_term', 'both'], true) ? 4000 : null,
        ];
    }

    private function createProperty(User $owner, string $rentalType = 'short_term'): TestResponse
    {
        Sanctum::actingAs($owner);

        return $this->postJson('/api/v1/properties', $this->validPropertyPayload($rentalType));
    }

    public function test_an_owners_first_listing_is_free_whatever_its_rental_type(): void
    {
        $owner = User::factory()->create();

        // long_term is the type that used to owe the fee unconditionally
        // — proving it is free here proves the rental_type rule is gone.
        $created = $this->createProperty($owner, 'long_term')->assertCreated()->json('property');

        $this->assertSame('paid', $created['publication_status']);
        $this->assertTrue($owner->fresh()->has_used_free_listing);

        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/properties/{$created['id']}/publish")->assertOk();
    }

    public function test_an_owners_second_listing_owes_the_fee(): void
    {
        $owner = User::factory()->create();

        $this->createProperty($owner, 'short_term')->assertCreated();
        $second = $this->createProperty($owner, 'short_term')->assertCreated()->json('property');

        $this->assertSame('pending_payment', $second['publication_status']);

        Sanctum::actingAs($owner);
        // 402 Payment Required, not 409: the frontend needs to tell "pay
        // first and this works" apart from "you cannot do this".
        $this->patchJson("/api/v1/properties/{$second['id']}/publish")->assertStatus(402);
    }

    public function test_deleting_the_free_listing_does_not_restore_it(): void
    {
        $owner = User::factory()->create();

        $first = $this->createProperty($owner, 'short_term')->assertCreated()->json('property');

        Sanctum::actingAs($owner);
        $this->deleteJson("/api/v1/properties/{$first['id']}")->assertOk();

        // The owner still has zero properties right now, yet the very
        // next one they create is NOT free — has_used_free_listing is
        // never unset.
        $second = $this->createProperty($owner, 'short_term')->assertCreated()->json('property');
        $this->assertSame('pending_payment', $second['publication_status']);
    }

    public function test_paying_the_fee_publishes_the_additional_listing(): void
    {
        $owner = User::factory()->hasUsedFreeListing()->create();
        $property = Property::factory()
            ->shortTerm()
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
        $owner = User::factory()->create();
        $property = Property::factory()->for($owner, 'owner')->create(); // factory default: already paid

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/properties/{$property->id}/publication-payment")
            ->assertStatus(409);
    }

    public function test_an_admin_can_publish_without_the_fee(): void
    {
        // Deliberate override: cash taken at the office, a goodwill
        // gesture. The fee stays recorded as unpaid so the revenue
        // figures do not claim money nobody sent.
        $admin = User::factory()->admin()->create();
        $property = Property::factory()
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
