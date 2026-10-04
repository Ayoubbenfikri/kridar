<?php

namespace Tests\Feature\Sales;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Property sales — phase S2: price filter, price sort, and the messaging
 * card. Everything is checked through the HTTP layer, same as
 * SaleListingTest.
 */
class SaleSearchTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<int, int>
     */
    private function idsOf(string $url): array
    {
        return collect($this->getJson($url)->assertOk()->json('data'))->pluck('id')->all();
    }

    // ---- the price filter -----------------------------------------------

    public function test_the_price_range_of_a_sale_search_uses_the_sale_price(): void
    {
        $cheap = Property::factory()->forSale()->create(['sale_price' => 500000]);
        $middle = Property::factory()->forSale()->create(['sale_price' => 1500000]);
        $dear = Property::factory()->forSale()->create(['sale_price' => 3000000]);

        $ids = $this->idsOf('/api/v1/properties?listing_type=sale&min_price=1000000&max_price=2000000');

        $this->assertSame([$middle->id], $ids);
        $this->assertNotContains($cheap->id, $ids);
        $this->assertNotContains($dear->id, $ids);
    }

    public function test_a_min_price_alone_works_on_a_sale_search(): void
    {
        $cheap = Property::factory()->forSale()->create(['sale_price' => 500000]);
        $dear = Property::factory()->forSale()->create(['sale_price' => 3000000]);

        $ids = $this->idsOf('/api/v1/properties?listing_type=sale&min_price=1000000');

        $this->assertContains($dear->id, $ids);
        $this->assertNotContains($cheap->id, $ids);
    }

    public function test_the_rental_price_range_still_uses_the_nightly_price(): void
    {
        $cheap = Property::factory()->shortTerm()->create(['price_per_night' => 200]);
        $dear = Property::factory()->shortTerm()->create(['price_per_night' => 900]);
        // A sale whose price would match if the wrong column were read.
        Property::factory()->forSale()->create(['sale_price' => 500]);

        $ids = $this->idsOf('/api/v1/properties?min_price=100&max_price=300');

        $this->assertSame([$cheap->id], $ids);
        $this->assertNotContains($dear->id, $ids);
    }

    public function test_rental_only_filters_are_ignored_in_a_sale_search(): void
    {
        $sale = Property::factory()->forSale()->create();

        // Without the guard these two would compare against null columns
        // and the sale would silently disappear from its own list.
        $ids = $this->idsOf('/api/v1/properties?listing_type=sale&rental_type=short_term&max_guests=4');

        $this->assertContains($sale->id, $ids);
    }

    // ---- the price sort -------------------------------------------------

    public function test_sales_sort_by_price_ascending_and_descending(): void
    {
        $dear = Property::factory()->forSale()->create(['sale_price' => 3000000]);
        $cheap = Property::factory()->forSale()->create(['sale_price' => 500000]);
        $middle = Property::factory()->forSale()->create(['sale_price' => 1500000]);

        $this->assertSame(
            [$cheap->id, $middle->id, $dear->id],
            $this->idsOf('/api/v1/properties?listing_type=sale&sort=price_asc'),
        );

        $this->assertSame(
            [$dear->id, $middle->id, $cheap->id],
            $this->idsOf('/api/v1/properties?listing_type=sale&sort=price_desc'),
        );
    }

    public function test_a_rental_without_a_nightly_price_sorts_last_in_both_directions(): void
    {
        $a = Property::factory()->shortTerm()->create(['price_per_night' => 300]);
        $c = Property::factory()->shortTerm()->create(['price_per_night' => 100]);
        // Long-term only: no nightly price at all.
        $b = Property::factory()->create([
            'rental_type' => 'long_term',
            'price_per_night' => null,
            'price_per_month' => 3000,
        ]);

        $this->assertSame([$c->id, $a->id, $b->id], $this->idsOf('/api/v1/properties?sort=price_asc'));
        $this->assertSame([$a->id, $c->id, $b->id], $this->idsOf('/api/v1/properties?sort=price_desc'));
    }

    public function test_a_long_term_search_sorts_by_the_monthly_price(): void
    {
        $dear = Property::factory()->create([
            'rental_type' => 'long_term',
            'price_per_night' => null,
            'price_per_month' => 6000,
        ]);
        $cheap = Property::factory()->create([
            'rental_type' => 'long_term',
            'price_per_night' => null,
            'price_per_month' => 2500,
        ]);

        $this->assertSame(
            [$cheap->id, $dear->id],
            $this->idsOf('/api/v1/properties?rental_type=long_term&sort=price_asc'),
        );
    }

    public function test_an_unknown_sort_is_refused(): void
    {
        $this->getJson('/api/v1/properties?sort=cheapest')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sort');
    }

    public function test_no_sort_still_means_newest_first(): void
    {
        $older = Property::factory()->shortTerm()->create(['published_at' => now()->subDays(5)]);
        $newer = Property::factory()->shortTerm()->create(['published_at' => now()->subDay()]);

        $this->assertSame([$newer->id, $older->id], $this->idsOf('/api/v1/properties'));
    }

    // ---- contacting the seller ------------------------------------------

    public function test_a_visitor_can_message_the_seller_of_a_sale(): void
    {
        $sale = Property::factory()->forSale()->create();

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/conversations', [
            'property_id' => $sale->id,
            'body' => 'Bonjour, le prix est-il negociable ?',
        ])->assertCreated();
    }

    public function test_a_shared_sale_card_carries_the_sale_price(): void
    {
        $seller = User::factory()->create();
        $sale = Property::factory()->forSale()->for($seller, 'owner')->create(['sale_price' => 1850000]);

        $buyer = User::factory()->create();
        Sanctum::actingAs($buyer);

        $conversationId = $this->postJson('/api/v1/conversations', [
            'property_id' => $sale->id,
            'body' => 'Bonjour, ce bien est-il encore disponible ?',
        ])->assertCreated()->json('conversation.id');

        Sanctum::actingAs($seller);

        $card = $this->postJson("/api/v1/conversations/{$conversationId}/messages", [
            'body' => 'Voici les details.',
            'shared_property_id' => $sale->id,
        ])->assertCreated()->json('data.shared_property');

        $this->assertSame('sale', $card['listing_type']);
        $this->assertEquals(1850000, (float) $card['sale_price']);
        $this->assertNull($card['price_per_night']);
        $this->assertNull($card['price_per_month']);
    }
}
