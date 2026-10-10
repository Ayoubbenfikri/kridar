<?php

namespace Tests\Feature\Analytics;

use App\Enums\AnalyticsEventName;
use App\Models\AnalyticsEvent;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase A2 - GET /admin/analytics and the analytics:prune command.
 */
class AdminAnalyticsReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-10 15:00:00'));
    }

    /** Writes one event directly, the way AnalyticsService would. */
    private function event(AnalyticsEventName $name, array $attributes = [], ?Carbon $at = null): AnalyticsEvent
    {
        $event = new AnalyticsEvent([
            'name' => $name,
            'path' => '/',
            'visitor_hash' => str_repeat('a', 64),
            'is_authenticated' => false,
            'is_entry' => false,
            'device' => 'desktop',
            'locale' => 'fr',
            ...$attributes,
        ]);
        $event->created_at = $at ?? now();
        $event->save();

        return $event;
    }

    private function asAdmin(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
    }

    public function test_a_guest_cannot_read_the_analytics(): void
    {
        $this->getJson('/api/v1/admin/analytics')->assertUnauthorized();
    }

    public function test_a_normal_user_cannot_read_the_analytics(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/analytics')->assertForbidden();
    }

    public function test_an_unknown_range_is_refused(): void
    {
        $this->asAdmin();

        $this->getJson('/api/v1/admin/analytics?range=10y')->assertStatus(422);
    }

    public function test_the_default_range_is_30_days_with_one_row_per_day(): void
    {
        $this->asAdmin();

        $response = $this->getJson('/api/v1/admin/analytics')->assertOk();

        $response->assertJsonPath('range', '30d')
            ->assertJsonPath('from', '2026-09-11')
            ->assertJsonPath('to', '2026-10-10')
            ->assertJsonCount(30, 'daily');
    }

    public function test_visitors_and_page_views_are_counted_per_day(): void
    {
        // Today: one visitor with 2 page views, another with 1.
        $this->event(AnalyticsEventName::PageView, ['visitor_hash' => str_repeat('a', 64)]);
        $this->event(AnalyticsEventName::PageView, ['visitor_hash' => str_repeat('a', 64)]);
        $this->event(AnalyticsEventName::PageView, ['visitor_hash' => str_repeat('b', 64)]);
        // Yesterday: one visitor.
        $this->event(AnalyticsEventName::PageView, ['visitor_hash' => str_repeat('c', 64)], now()->subDay());
        // Outside a 7-day range: ignored.
        $this->event(AnalyticsEventName::PageView, [], now()->subDays(20));

        $this->asAdmin();
        $response = $this->getJson('/api/v1/admin/analytics?range=7d')->assertOk();

        $response->assertJsonPath('totals.visitors', 3)
            ->assertJsonPath('totals.page_views', 4)
            ->assertJsonPath('totals.today_visitors', 2)
            ->assertJsonPath('totals.today_page_views', 3)
            ->assertJsonPath('daily.6', ['date' => '2026-10-10', 'visitors' => 2, 'page_views' => 3])
            ->assertJsonPath('daily.5', ['date' => '2026-10-09', 'visitors' => 1, 'page_views' => 1])
            ->assertJsonPath('daily.0', ['date' => '2026-10-04', 'visitors' => 0, 'page_views' => 0]);
    }

    public function test_top_pages_are_sorted_by_views(): void
    {
        $this->event(AnalyticsEventName::PageView, ['path' => '/properties']);
        $this->event(AnalyticsEventName::PageView, ['path' => '/properties']);
        $this->event(AnalyticsEventName::PageView, ['path' => '/roommates']);

        $this->asAdmin();
        $this->getJson('/api/v1/admin/analytics')
            ->assertJsonPath('top_pages.0.path', '/properties')
            ->assertJsonPath('top_pages.0.views', 2)
            ->assertJsonPath('top_pages.1.path', '/roommates');
    }

    public function test_top_properties_carry_their_title_and_contacts_even_once_deleted(): void
    {
        $popular = Property::factory()->create(['title' => 'Riad Medina']);
        $deleted = Property::factory()->create(['title' => 'Old studio']);
        $deleted->delete();

        foreach ([1, 2, 3] as $i) {
            $this->event(AnalyticsEventName::ListingView, ['property_id' => $popular->id]);
        }
        $this->event(AnalyticsEventName::ContactClick, ['property_id' => $popular->id]);
        $this->event(AnalyticsEventName::ListingView, ['property_id' => $deleted->id]);

        $this->asAdmin();
        $this->getJson('/api/v1/admin/analytics')
            ->assertJsonPath('top_properties.0.title', 'Riad Medina')
            ->assertJsonPath('top_properties.0.views', 3)
            ->assertJsonPath('top_properties.0.contacts', 1)
            ->assertJsonPath('top_properties.1.title', 'Old studio')
            ->assertJsonPath('totals.listing_views', 4)
            ->assertJsonPath('conversion.contact_rate', 25);
    }

    public function test_sources_are_counted_on_the_first_page_of_each_visit(): void
    {
        $this->event(AnalyticsEventName::PageView, ['is_entry' => true, 'referrer_host' => 'google.com']);
        $this->event(AnalyticsEventName::PageView, ['is_entry' => true, 'referrer_host' => 'google.com']);
        $this->event(AnalyticsEventName::PageView, ['is_entry' => true, 'referrer_host' => 'google.com', 'utm_source' => 'facebook']);
        $this->event(AnalyticsEventName::PageView, ['is_entry' => true]);
        // A later page of a visit: not a source.
        $this->event(AnalyticsEventName::PageView);

        $this->asAdmin();
        $this->getJson('/api/v1/admin/analytics')
            ->assertJsonPath('totals.visits', 4)
            ->assertJsonPath('sources', [
                ['source' => 'google.com', 'visits' => 2],
                ['source' => 'direct', 'visits' => 1],
                ['source' => 'facebook', 'visits' => 1],
            ]);
    }

    public function test_devices_and_languages_count_visitors(): void
    {
        $this->event(AnalyticsEventName::PageView, ['visitor_hash' => str_repeat('a', 64), 'device' => 'mobile', 'locale' => 'ary']);
        $this->event(AnalyticsEventName::PageView, ['visitor_hash' => str_repeat('a', 64), 'device' => 'mobile', 'locale' => 'ary']);
        $this->event(AnalyticsEventName::PageView, ['visitor_hash' => str_repeat('b', 64), 'device' => 'desktop', 'locale' => 'fr']);

        $this->asAdmin();
        $this->getJson('/api/v1/admin/analytics')
            ->assertJsonPath('devices', [
                ['value' => 'desktop', 'visitors' => 1],
                ['value' => 'mobile', 'visitors' => 1],
            ])
            ->assertJsonFragment(['value' => 'ary', 'visitors' => 1]);
    }

    public function test_every_action_is_listed_even_at_zero(): void
    {
        $this->event(AnalyticsEventName::Search);
        $this->event(AnalyticsEventName::Search);

        $this->asAdmin();
        $actions = collect($this->getJson('/api/v1/admin/analytics')->json('actions'));

        $this->assertSame(count(AnalyticsEventName::cases()) - 1, $actions->count());
        $this->assertSame(['name' => 'search', 'total' => 2, 'visitors' => 1], $actions->first());
        $this->assertSame(0, $actions->firstWhere('name', 'booking_request')['total']);
        $this->assertNull($actions->firstWhere('name', 'page_view'));
    }

    public function test_no_data_gives_zeros_not_errors(): void
    {
        $this->asAdmin();

        $this->getJson('/api/v1/admin/analytics?range=90d')
            ->assertOk()
            ->assertJsonPath('totals.visitors', 0)
            ->assertJsonPath('conversion.contact_rate', null)
            ->assertJsonCount(90, 'daily')
            ->assertJsonPath('top_properties', []);
    }

    public function test_the_prune_command_deletes_events_older_than_12_months(): void
    {
        $old = $this->event(AnalyticsEventName::PageView, [], now()->subMonths(13));
        $recent = $this->event(AnalyticsEventName::PageView, [], now()->subMonths(11));

        $this->artisan('analytics:prune')->assertSuccessful();

        $this->assertModelMissing($old);
        $this->assertModelExists($recent);
    }
}
