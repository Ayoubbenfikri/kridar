<?php

namespace Tests\Unit;

use App\Services\PriceHistogramBuilder;
use PHPUnit\Framework\TestCase;

/**
 * The maths behind the price slider, with plain numbers: no database.
 */
class PriceHistogramBuilderTest extends TestCase
{
    public function test_no_prices_gives_an_empty_histogram(): void
    {
        $result = PriceHistogramBuilder::build([]);

        $this->assertSame(0, $result['total']);
        $this->assertSame([], $result['buckets']);
    }

    public function test_one_price_still_gives_a_usable_range(): void
    {
        $result = PriceHistogramBuilder::build([500.0]);

        $this->assertSame(1, $result['total']);
        $this->assertLessThanOrEqual(500, $result['min']);
        $this->assertGreaterThan(500, $result['max']);
        $this->assertSame(1, array_sum(array_column($result['buckets'], 'count')));
    }

    public function test_a_small_set_uses_a_nice_step_and_counts_every_price(): void
    {
        $result = PriceHistogramBuilder::build([100.0, 200.0, 300.0]);

        // range 200 / 30 bars = 6.7 -> rounded UP to the nice step 10.
        $this->assertSame(10, $result['step']);
        $this->assertSame(100, $result['min']);
        // Strictly above the highest price, or it would fall off the end.
        $this->assertGreaterThan(300, $result['max']);
        $this->assertSame(3, $result['total']);
        $this->assertSame(3, array_sum(array_column($result['buckets'], 'count')));
        $this->assertSame(1, $result['buckets'][0]['count']);
        $this->assertSame(100, $result['buckets'][0]['from']);
        $this->assertSame(110, $result['buckets'][0]['to']);
    }

    public function test_the_buckets_are_contiguous(): void
    {
        $result = PriceHistogramBuilder::build([150.0, 480.0, 910.0, 1200.0, 2750.0]);

        $buckets = $result['buckets'];
        $this->assertSame($result['min'], $buckets[0]['from']);
        $this->assertSame($result['max'], $buckets[array_key_last($buckets)]['to']);
        for ($i = 1; $i < count($buckets); $i++) {
            $this->assertSame($buckets[$i - 1]['to'], $buckets[$i]['from']);
        }
    }

    public function test_a_few_huge_prices_do_not_flatten_the_whole_chart(): void
    {
        // 24 ordinary prices (100..2400) and one absurd one.
        $prices = [];
        for ($price = 100; $price <= 2400; $price += 100) {
            $prices[] = (float) $price;
        }
        $prices[] = 1_000_000.0;

        $result = PriceHistogramBuilder::build($prices);

        // The slider stops near the ordinary prices, not at a million...
        $this->assertLessThan(10_000, $result['max']);
        // ...and the outlier is not lost: the last bar absorbs it.
        $this->assertSame(25, array_sum(array_column($result['buckets'], 'count')));
        $this->assertGreaterThanOrEqual(1, $result['buckets'][array_key_last($result['buckets'])]['count']);
    }

    public function test_sale_sized_prices_get_a_big_step(): void
    {
        $result = PriceHistogramBuilder::build([500_000.0, 1_500_000.0, 3_000_000.0]);

        // range 2.5M / 30 = 83k -> rounded up to 100k.
        $this->assertSame(100_000, $result['step']);
        $this->assertSame(500_000, $result['min']);
    }
}
