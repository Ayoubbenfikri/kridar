<?php

namespace App\Services;

use App\Enums\AnalyticsEventName;
use App\Models\AnalyticsEvent;
use App\Models\Property;
use App\Models\RoommateListing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Turns the raw analytics_events rows into what the admin Analytics page
 * shows (Phase A2). Read-only.
 *
 * About "visitors": a visitor is a DAILY hash (see AnalyticsService), so
 * the same person on two different days counts twice. Every visitor
 * number here is therefore "unique visitors per day, added up" - the
 * honest number a cookie-less design can give.
 *
 * Every query runs in the database (COUNT / GROUP BY), never by loading
 * rows into PHP: the table grows with every page view.
 */
class AnalyticsReportService
{
    private const TOP_LIMIT = 10;

    /**
     * @return array<string, mixed>
     */
    public function build(int $days): array
    {
        $from = now()->startOfDay()->subDays($days - 1);
        $today = now()->startOfDay();

        $daily = $this->daily($from, $days);

        $pageViews = (int) array_sum(array_column($daily, 'page_views'));
        $listingViews = $this->countOf(AnalyticsEventName::ListingView, $from);
        $contactClicks = $this->countOf(AnalyticsEventName::ContactClick, $from);
        $bookingRequests = $this->countOf(AnalyticsEventName::BookingRequest, $from);

        $todayRow = $daily[array_key_last($daily)];

        return [
            'from' => $from->toDateString(),
            'to' => $today->toDateString(),
            'totals' => [
                'visitors' => (int) array_sum(array_column($daily, 'visitors')),
                'visits' => $this->events($from)
                    ->where('name', AnalyticsEventName::PageView)
                    ->where('is_entry', true)
                    ->count(),
                'page_views' => $pageViews,
                'listing_views' => $listingViews,
                'today_visitors' => $todayRow['visitors'],
                'today_page_views' => $todayRow['page_views'],
            ],
            'conversion' => [
                // Out of 100 listing views, how many led to a contact /
                // a booking request. Null when there is nothing to divide.
                'contact_rate' => $this->percent($contactClicks, $listingViews),
                'booking_rate' => $this->percent($bookingRequests, $listingViews),
            ],
            'daily' => $daily,
            'top_pages' => $this->topPages($from),
            'top_properties' => $this->topProperties($from),
            'top_roommate_listings' => $this->topRoommateListings($from),
            'sources' => $this->sources($from),
            'devices' => $this->breakdown('device', $from),
            'locales' => $this->breakdown('locale', $from),
            'actions' => $this->actions($from),
        ];
    }

    /** Every event since $from. A fresh builder each call. */
    private function events(Carbon $from): Builder
    {
        return AnalyticsEvent::query()->where('created_at', '>=', $from);
    }

    private function countOf(AnalyticsEventName $name, Carbon $from): int
    {
        return $this->events($from)->where('name', $name)->count();
    }

    private function percent(int $part, int $whole): ?float
    {
        return $whole > 0 ? round($part / $whole * 100, 1) : null;
    }

    /**
     * One row per day of the period - days without any event included,
     * with zeros, so the chart has no holes.
     *
     * @return list<array{date: string, visitors: int, page_views: int}>
     */
    private function daily(Carbon $from, int $days): array
    {
        $rows = $this->events($from)
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COUNT(DISTINCT visitor_hash) as visitors')
            ->selectRaw('SUM(CASE WHEN name = ? THEN 1 ELSE 0 END) as page_views', [AnalyticsEventName::PageView->value])
            ->groupByRaw('DATE(created_at)')
            ->get()
            ->keyBy(fn ($row) => Carbon::parse($row->day)->toDateString());

        $result = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $from->copy()->addDays($i)->toDateString();
            $row = $rows->get($date);

            $result[] = [
                'date' => $date,
                'visitors' => (int) ($row->visitors ?? 0),
                'page_views' => (int) ($row->page_views ?? 0),
            ];
        }

        return $result;
    }

    /** @return list<array{path: string, views: int, visitors: int}> */
    private function topPages(Carbon $from): array
    {
        return $this->events($from)
            ->where('name', AnalyticsEventName::PageView)
            ->select('path')
            ->selectRaw('COUNT(*) as views')
            ->selectRaw('COUNT(DISTINCT visitor_hash) as visitors')
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(self::TOP_LIMIT)
            ->get()
            ->map(fn ($row) => [
                'path' => $row->path,
                'views' => (int) $row->views,
                'visitors' => (int) $row->visitors,
            ])
            ->all();
    }

    /**
     * The most viewed properties, with how many contact clicks each got.
     * A deleted listing keeps its numbers; its title comes back null.
     *
     * @return list<array{id: int, title: ?string, views: int, visitors: int, contacts: int}>
     */
    private function topProperties(Carbon $from): array
    {
        $rows = $this->topBy('property_id', AnalyticsEventName::ListingView, $from);
        $ids = $rows->pluck('id')->all();

        $titles = Property::withTrashed()->whereIn('id', $ids)->pluck('title', 'id');
        $contacts = $this->countsFor('property_id', $ids, AnalyticsEventName::ContactClick, $from);

        return $rows->map(fn ($row) => [
            'id' => (int) $row->id,
            'title' => $titles->get($row->id),
            'views' => (int) $row->views,
            'visitors' => (int) $row->visitors,
            'contacts' => (int) ($contacts->get($row->id) ?? 0),
        ])->all();
    }

    /** @return list<array{id: int, title: ?string, views: int, visitors: int, contacts: int}> */
    private function topRoommateListings(Carbon $from): array
    {
        $rows = $this->topBy('roommate_listing_id', AnalyticsEventName::RoommateView, $from);
        $ids = $rows->pluck('id')->all();

        $titles = RoommateListing::withTrashed()->whereIn('id', $ids)->pluck('title', 'id');
        $contacts = $this->countsFor('roommate_listing_id', $ids, AnalyticsEventName::ContactClick, $from);

        return $rows->map(fn ($row) => [
            'id' => (int) $row->id,
            'title' => $titles->get($row->id),
            'views' => (int) $row->views,
            'visitors' => (int) $row->visitors,
            'contacts' => (int) ($contacts->get($row->id) ?? 0),
        ])->all();
    }

    /**
     * @param  'property_id'|'roommate_listing_id'  $column  never user input
     */
    private function topBy(string $column, AnalyticsEventName $name, Carbon $from): Collection
    {
        return $this->events($from)
            ->where('name', $name)
            ->whereNotNull($column)
            ->select("{$column} as id")
            ->selectRaw('COUNT(*) as views')
            ->selectRaw('COUNT(DISTINCT visitor_hash) as visitors')
            ->groupBy($column)
            ->orderByDesc('views')
            ->limit(self::TOP_LIMIT)
            ->get();
    }

    /**
     * @param  'property_id'|'roommate_listing_id'  $column  never user input
     * @param  array<int, int>  $ids
     */
    private function countsFor(string $column, array $ids, AnalyticsEventName $name, Carbon $from): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return $this->events($from)
            ->where('name', $name)
            ->whereIn($column, $ids)
            ->groupBy($column)
            ->selectRaw("{$column} as id, COUNT(*) as total")
            ->pluck('total', 'id');
    }

    /**
     * Where visits came from: the ad campaign (utm_source) when there is
     * one, else the previous site, else "direct" (typed address, bookmark,
     * an app that hides the referrer). Counted on the first page of each
     * visit only.
     *
     * @return list<array{source: string, visits: int}>
     */
    private function sources(Carbon $from): array
    {
        $source = "COALESCE(utm_source, referrer_host, 'direct')";

        return $this->events($from)
            ->where('name', AnalyticsEventName::PageView)
            ->where('is_entry', true)
            ->selectRaw("{$source} as source")
            ->selectRaw('COUNT(*) as visits')
            ->groupByRaw($source)
            ->orderByDesc('visits')
            // Ties in alphabetical order, so the list does not reshuffle
            // between two refreshes.
            ->orderByRaw($source)
            ->limit(self::TOP_LIMIT)
            ->get()
            ->map(fn ($row) => ['source' => $row->source, 'visits' => (int) $row->visits])
            ->all();
    }

    /**
     * Visitors per device or per language.
     *
     * @param  'device'|'locale'  $column  never user input
     * @return list<array{value: string, visitors: int}>
     */
    private function breakdown(string $column, Carbon $from): array
    {
        return $this->events($from)
            ->select($column)
            ->selectRaw('COUNT(DISTINCT visitor_hash) as visitors')
            ->groupBy($column)
            ->orderByDesc('visitors')
            ->orderBy($column)
            ->get()
            ->map(fn ($row) => ['value' => $row->{$column}, 'visitors' => (int) $row->visitors])
            ->all();
    }

    /**
     * Every tracked action (everything but page_view), zeros included so
     * the admin sees "0 bookings" rather than a missing line.
     *
     * @return list<array{name: string, total: int, visitors: int}>
     */
    private function actions(Carbon $from): array
    {
        $rows = $this->events($from)
            ->where('name', '!=', AnalyticsEventName::PageView)
            ->select('name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COUNT(DISTINCT visitor_hash) as visitors')
            ->groupBy('name')
            ->get()
            ->keyBy(fn ($row) => $row->name->value);

        $result = [];

        foreach (AnalyticsEventName::cases() as $name) {
            if ($name === AnalyticsEventName::PageView) {
                continue;
            }

            $row = $rows->get($name->value);

            $result[] = [
                'name' => $name->value,
                'total' => (int) ($row->total ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
            ];
        }

        usort($result, fn ($a, $b) => $b['total'] <=> $a['total']);

        return $result;
    }
}
