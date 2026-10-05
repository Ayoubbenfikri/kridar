<?php

namespace Tests\Feature\Properties;

use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * GET /api/v1/properties/price-histogram - the data behind the price
 * slider. Checked through the HTTP layer, like the search it mirrors.
 */
class PriceHistogramTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function histogram(string $query = ''): array
    {
        return $this->getJson('/api/v1/properties/price-histogram'.$query)
            ->assertOk()
            ->json('data');
    }

    public function test_it_is_public_and_empty_when_nothing_is_published(): void
    {
        $data = $this->histogram();

        $this->assertSame(0, $data['total']);
        $this->assertSame([], $data['buckets']);
    }

    public function test_the_default_is_the_nightly_price_of_published_rentals(): void
    {
        Property::factory()->shortTerm()->create(['price_per_night' => 300]);
        Property::factory()->shortTerm()->create(['price_per_night' => 700]);
        // None of these belongs in the nightly distribution:
        Property::factory()->shortTerm()->draft()->create(['price_per_night' => 5000]); // not published
        Property::factory()->longTerm()->create();                                       // no nightly price
        Property::factory()->forSale()->create(['sale_price' => 900000]);                // a sale

        $data = $this->histogram();

        $this->assertSame(2, $data['total']);
        $this->assertSame(2, array_sum(array_column($data['buckets'], 'count')));
        $this->assertLessThanOrEqual(300, $data['min']);
        $this->assertGreaterThan(700, $data['max']);
    }

    public function test_long_term_uses_the_monthly_price(): void
    {
        Property::factory()->longTerm()->create(['price_per_month' => 4000]);
        Property::factory()->longTerm()->create(['price_per_month' => 9000]);
        // A short-term-only listing does not offer a monthly rental.
        Property::factory()->shortTerm()->create(['price_per_night' => 400]);

        $data = $this->histogram('?rental_type=long_term');

        $this->assertSame(2, $data['total']);
        $this->assertLessThanOrEqual(4000, $data['min']);
        $this->assertGreaterThan(9000, $data['max']);
    }

    public function test_a_sale_uses_the_sale_price_and_ignores_rental_type(): void
    {
        Property::factory()->forSale()->create(['sale_price' => 600000]);
        Property::factory()->forSale()->create(['sale_price' => 2400000]);
        Property::factory()->shortTerm()->create(['price_per_night' => 300]);

        // A leftover rental_type must not change a sale histogram.
        $data = $this->histogram('?listing_type=sale&rental_type=long_term');

        $this->assertSame(2, $data['total']);
        $this->assertLessThanOrEqual(600000, $data['min']);
        $this->assertGreaterThan(2400000, $data['max']);
    }

    public function test_the_bars_add_up_to_the_total_and_follow_each_other(): void
    {
        foreach ([250, 320, 480, 510, 900, 1500] as $price) {
            Property::factory()->shortTerm()->create(['price_per_night' => $price]);
        }

        $data = $this->histogram();

        $this->assertSame(6, $data['total']);
        $this->assertSame(6, array_sum(array_column($data['buckets'], 'count')));
        $this->assertSame($data['min'], $data['buckets'][0]['from']);
        $this->assertSame($data['max'], $data['buckets'][array_key_last($data['buckets'])]['to']);
    }

    public function test_an_unknown_listing_type_is_refused(): void
    {
        $this->getJson('/api/v1/properties/price-histogram?listing_type=nonsense')
            ->assertStatus(422)
            ->assertJsonValidationErrors('listing_type');
    }

    public function test_the_route_is_not_swallowed_by_the_property_id_route(): void
    {
        // If {property} matched first this would be a 404 (no property
        // called "price-histogram").
        $this->getJson('/api/v1/properties/price-histogram')->assertOk();
    }
}
