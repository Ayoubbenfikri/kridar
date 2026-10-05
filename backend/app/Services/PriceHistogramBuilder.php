<?php

namespace App\Services;

/**
 * Turns a list of prices into the data behind the price slider on the
 * search pages: a bounded range, a step, and ~30 bars saying how many
 * listings sit in each price band.
 *
 * Pure (no database, no Laravel): give it prices, get an array back, which
 * is what makes it easy to test with plain numbers.
 */
final class PriceHistogramBuilder
{
    /** How many bars we aim for. The real count depends on the "nice" step. */
    private const TARGET_BUCKETS = 30;

    /**
     * Below this many listings the top of the range is simply the highest
     * price. From here on a few very expensive listings must not flatten
     * every other bar, so the top is the 95th percentile instead and the
     * last bar absorbs everything above it ("17000+" on the slider).
     */
    private const OUTLIER_CUT_FROM = 20;

    /**
     * @param  array<int, float|int>  $prices  ascending, all > 0
     * @return array{min: int|float, max: int|float, step: int|float, total: int, buckets: array<int, array{from: int|float, to: int|float, count: int}>}
     */
    public static function build(array $prices): array
    {
        $prices = array_values($prices);
        $total = count($prices);

        if ($total === 0) {
            return ['min' => 0, 'max' => 0, 'step' => 1, 'total' => 0, 'buckets' => []];
        }

        $lowest = $prices[0];
        $top = $total >= self::OUTLIER_CUT_FROM
            ? $prices[(int) ceil(0.95 * $total) - 1]
            : $prices[$total - 1];

        // A range of at least 1 so a single price (or all-equal prices)
        // still gives a usable slider.
        $range = max($top - $lowest, 1);
        $width = self::niceCeil($range / self::TARGET_BUCKETS);

        $start = floor($lowest / $width) * $width;
        $count = max(1, (int) ceil(($top - $start) / $width));
        // The slider's maximum must be strictly above the top price, or the
        // top price would fall outside the last bar.
        if ($start + $count * $width <= $top) {
            $count++;
        }

        $counts = array_fill(0, $count, 0);
        foreach ($prices as $price) {
            // min(): everything above the cut-off lands in the last bar.
            $counts[min($count - 1, (int) floor(($price - $start) / $width))]++;
        }

        $buckets = [];
        foreach ($counts as $index => $bucketCount) {
            $buckets[] = [
                'from' => self::clean($start + $index * $width),
                'to' => self::clean($start + ($index + 1) * $width),
                'count' => $bucketCount,
            ];
        }

        return [
            'min' => self::clean($start),
            'max' => self::clean($start + $count * $width),
            'step' => self::clean($width),
            'total' => $total,
            'buckets' => $buckets,
        ];
    }

    /**
     * Rounds UP to 1, 2 or 5 times a power of ten (1, 2, 5, 10, 20, 50,
     * 100 ...) so the slider steps look natural. Never below 1: prices are
     * whole dirhams for this site.
     */
    private static function niceCeil(float $value): float
    {
        if ($value <= 1) {
            return 1;
        }

        $base = 10 ** floor(log10($value));
        $factor = $value / $base;

        return match (true) {
            $factor <= 1 => $base,
            $factor <= 2 => 2 * $base,
            $factor <= 5 => 5 * $base,
            default => 10 * $base,
        };
    }

    /** 500.0 -> 500 (int) so the JSON reads "500", not "500.0". */
    private static function clean(float|int $number): int|float
    {
        $rounded = round($number, 2);

        return $rounded == floor($rounded) ? (int) $rounded : $rounded;
    }
}
