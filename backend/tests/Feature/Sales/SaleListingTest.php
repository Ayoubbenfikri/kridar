<?php

namespace Tests\Feature\Sales;

use App\Enums\ListingType;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Property sales ("buying") — phase S1, backend only.
 *
 * A sale is a property with listing_type = 'sale': no rental_type, no
 * nightly/monthly price, a sale_price instead, and it can never be booked.
 * Every rule below is checked through the HTTP layer on purpose — the
 * frontend will hide the booking panel on a sale, but hiding a panel is not
 * a rule, so these tests prove the API refuses even when it is bypassed.
 */
class SaleListingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function salePayload(array $overrides = []): array
    {
        return array_merge([
            'listing_type' => 'sale',
            'title' => 'Villa a vendre a Marrakech',
            'description' => str_repeat('Lorem ipsum dolor sit amet. ', 3),
            'property_type' => 'villa',
            'address' => '12 Rue Example',
            'city' => 'Marrakech',
            'bedrooms' => 4,
            'bathrooms' => 2,
            'sale_price' => 1850000,
            'price_negotiable' => true,
            'year_built' => 2015,
            'property_condition' => 'good',
            'legal_status' => 'titled',
        ], $overrides);
    }

    /**
     * A rental payload that never mentions listing_type, exactly like a
     * client written before sales existed.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function rentPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'A lovely place to stay',
            'description' => str_repeat('Lorem ipsum dolor sit amet. ', 3),
            'property_type' => 'apartment',
            'rental_type' => 'short_term',
            'address' => '12 Rue Example',
            'city' => 'Marrakech',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'max_guests' => 4,
            'price_per_night' => 500,
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function createAs(User $owner, array $payload): TestResponse
    {
        Sanctum::actingAs($owner);

        return $this->postJson('/api/v1/properties', $payload);
    }

    // ---- creating -------------------------------------------------------

    public function test_a_sale_listing_can_be_created_as_a_draft(): void
    {
        $owner = User::factory()->create();

        $property = $this->createAs($owner, $this->salePayload())->assertCreated()->json('property');

        $this->assertSame('sale', $property['listing_type']);
        $this->assertNull($property['rental_type']);
        $this->assertSame('draft', $property['status']);
        $this->assertEquals(1850000, (float) $property['sale_price']);
        $this->assertTrue($property['price_negotiable']);
        $this->assertSame(2015, $property['year_built']);
        $this->assertSame('good', $property['property_condition']);
        $this->assertSame('titled', $property['legal_status']);

        $this->assertDatabaseHas('properties', ['id' => $property['id'], 'listing_type' => 'sale']);
    }

    public function test_a_sale_listing_requires_a_sale_price(): void
    {
        $owner = User::factory()->create();

        $payload = $this->salePayload();
        unset($payload['sale_price']);

        $this->createAs($owner, $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sale_price');
    }

    public function test_a_sale_price_must_be_positive(): void
    {
        $owner = User::factory()->create();

        $this->createAs($owner, $this->salePayload(['sale_price' => 0]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sale_price');
    }

    public function test_rental_fields_sent_with_a_sale_are_ignored(): void
    {
        $owner = User::factory()->create();

        $created = $this->createAs($owner, $this->salePayload([
            'rental_type' => 'short_term',
            'max_guests' => 4,
            'price_per_night' => 500,
            'price_per_month' => 4000,
        ]))->assertCreated()->json('property');

        $property = Property::findOrFail($created['id']);

        $this->assertNull($property->rental_type);
        $this->assertNull($property->max_guests);
        $this->assertNull($property->price_per_night);
        $this->assertNull($property->price_per_month);
    }

    public function test_land_can_be_sold_without_bedrooms_or_bathrooms(): void
    {
        $owner = User::factory()->create();

        $payload = $this->salePayload(['property_type' => 'land']);
        unset($payload['bedrooms'], $payload['bathrooms']);

        $property = $this->createAs($owner, $payload)->assertCreated()->json('property');

        $this->assertSame('land', $property['property_type']);
        $this->assertSame(0, $property['bedrooms']);
        $this->assertSame(0, $property['bathrooms']);
    }

    public function test_land_cannot_be_rented(): void
    {
        $owner = User::factory()->create();

        $this->createAs($owner, $this->rentPayload(['property_type' => 'land']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('property_type');
    }

    public function test_a_commercial_premises_can_be_rented(): void
    {
        $owner = User::factory()->create();

        $this->createAs($owner, $this->rentPayload(['property_type' => 'commercial']))
            ->assertCreated();
    }

    public function test_a_request_without_listing_type_is_still_a_rental(): void
    {
        $owner = User::factory()->create();

        $property = $this->createAs($owner, $this->rentPayload())->assertCreated()->json('property');

        $this->assertSame('rent', $property['listing_type']);
        $this->assertSame('short_term', $property['rental_type']);
    }

    public function test_sale_fields_sent_with_a_rental_are_ignored(): void
    {
        $owner = User::factory()->create();

        $created = $this->createAs($owner, $this->rentPayload([
            'sale_price' => 999999,
            'legal_status' => 'titled',
        ]))->assertCreated()->json('property');

        $property = Property::findOrFail($created['id']);

        $this->assertNull($property->sale_price);
        $this->assertNull($property->legal_status);
    }

    public function test_an_unknown_listing_type_is_refused(): void
    {
        $owner = User::factory()->create();

        $this->createAs($owner, $this->rentPayload(['listing_type' => 'swap']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('listing_type');
    }

    // ---- the publication fee --------------------------------------------

    public function test_a_sale_follows_the_same_fee_rule_as_any_other_listing(): void
    {
        $owner = User::factory()->create();

        // The owner's first-ever listing is free, whatever kind it is...
        $first = $this->createAs($owner, $this->salePayload())->assertCreated()->json('property');
        $this->assertSame('paid', $first['publication_status']);

        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/properties/{$first['id']}/publish")->assertOk();

        // ...and the next one owes the fee before it can go live.
        $second = $this->createAs($owner, $this->salePayload(['title' => 'Another villa for sale']))
            ->assertCreated()
            ->json('property');
        $this->assertSame('pending_payment', $second['publication_status']);

        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/properties/{$second['id']}/publish")->assertStatus(402);
    }

    // ---- searching ------------------------------------------------------

    public function test_the_default_search_never_returns_properties_for_sale(): void
    {
        $rental = Property::factory()->shortTerm()->create();
        $sale = Property::factory()->forSale()->create();

        $ids = collect($this->getJson('/api/v1/properties')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertContains($rental->id, $ids);
        $this->assertNotContains($sale->id, $ids);
    }

    public function test_a_sale_search_returns_only_properties_for_sale(): void
    {
        $rental = Property::factory()->shortTerm()->create();
        $sale = Property::factory()->forSale()->create();

        $ids = collect($this->getJson('/api/v1/properties?listing_type=sale')->assertOk()->json('data'))
            ->pluck('id')
            ->all();

        $this->assertContains($sale->id, $ids);
        $this->assertNotContains($rental->id, $ids);
    }

    public function test_a_published_sale_is_readable_by_anyone(): void
    {
        $sale = Property::factory()->forSale()->create();

        $property = $this->getJson("/api/v1/properties/{$sale->id}")->assertOk()->json('property');

        $this->assertSame(ListingType::Sale->value, $property['listing_type']);
        $this->assertNull($property['rental_type']);
    }

    // ---- bookings are impossible on a sale ------------------------------

    public function test_a_sale_cannot_be_reserved(): void
    {
        $sale = Property::factory()->forSale()->create();
        $guest = User::factory()->create();

        Sanctum::actingAs($guest);

        // 422 with a message on property_id — not a 500 from reading the
        // null rental_type.
        $this->postJson('/api/v1/reservations', [
            'property_id' => $sale->id,
            'rental_type' => 'short_term',
            'start_date' => now()->addDays(3)->toDateString(),
            'end_date' => now()->addDays(6)->toDateString(),
        ])->assertUnprocessable()->assertJsonValidationErrors('property_id');

        $this->assertSame(0, Reservation::count());
    }

    public function test_the_price_preview_refuses_a_sale(): void
    {
        $sale = Property::factory()->forSale()->create();
        $guest = User::factory()->create();

        Sanctum::actingAs($guest);

        $this->postJson('/api/v1/reservations/price-preview', [
            'property_id' => $sale->id,
            'rental_type' => 'long_term',
            'start_date' => now()->addDays(3)->toDateString(),
            'end_date' => now()->addDays(40)->toDateString(),
        ])->assertUnprocessable()->assertJsonValidationErrors('property_id');
    }

    public function test_a_sale_has_no_availability_calendar(): void
    {
        $sale = Property::factory()->forSale()->create();

        $this->getJson("/api/v1/properties/{$sale->id}/availability?start=".now()->toDateString().'&end='.now()->addDays(30)->toDateString())
            ->assertNotFound();
    }

    // ---- updating -------------------------------------------------------

    public function test_a_sale_can_be_updated_but_never_changes_its_listing_type(): void
    {
        $owner = User::factory()->create();
        $sale = Property::factory()->forSale()->for($owner, 'owner')->create();

        Sanctum::actingAs($owner);

        $property = $this->putJson("/api/v1/properties/{$sale->id}", [
            'sale_price' => 2000000,
            // All three must be ignored: the type is fixed at creation and
            // rental data does not exist on a sale.
            'listing_type' => 'rent',
            'rental_type' => 'short_term',
            'price_per_night' => 300,
        ])->assertOk()->json('property');

        $this->assertEquals(2000000, (float) $property['sale_price']);
        $this->assertSame('sale', $property['listing_type']);

        $fresh = $sale->fresh();
        $this->assertTrue($fresh->isForSale());
        $this->assertNull($fresh->rental_type);
        $this->assertNull($fresh->price_per_night);
    }

    public function test_a_rental_cannot_be_turned_into_a_sale_or_given_a_sale_price(): void
    {
        $owner = User::factory()->create();
        $rental = Property::factory()->shortTerm()->for($owner, 'owner')->create();

        Sanctum::actingAs($owner);

        $this->putJson("/api/v1/properties/{$rental->id}", [
            'listing_type' => 'sale',
            'sale_price' => 1000000,
        ])->assertOk();

        $fresh = $rental->fresh();
        $this->assertFalse($fresh->isForSale());
        $this->assertNull($fresh->sale_price);
    }
}
