<?php

namespace Tests\Feature\Analytics;

use App\Enums\AnalyticsEventName;
use App\Models\AnalyticsEvent;
use App\Models\User;
use App\Services\AnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase A1 - POST /analytics/collect.
 */
class AnalyticsCollectTest extends TestCase
{
    use RefreshDatabase;

    private const PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

    private const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

    private function collect(array $data, string $userAgent = self::DESKTOP, array $headers = [])
    {
        return $this->withHeaders(['User-Agent' => $userAgent, ...$headers])
            ->postJson('/api/v1/analytics/collect', $data);
    }

    public function test_a_guest_page_view_is_recorded(): void
    {
        $this->collect(['name' => 'page_view', 'path' => '/properties'])->assertNoContent();

        $event = AnalyticsEvent::sole();
        $this->assertSame(AnalyticsEventName::PageView, $event->name);
        $this->assertSame('/properties', $event->path);
        $this->assertFalse($event->is_authenticated);
        $this->assertSame('desktop', $event->device);
        // The test client always sends "Accept-Language: en-us" (Symfony's
        // default) - test_the_language_comes_from_the_request covers this.
        $this->assertSame('en', $event->locale);
        $this->assertSame(64, strlen($event->visitor_hash));
    }

    public function test_an_unknown_event_name_is_refused(): void
    {
        $this->collect(['name' => 'hacked', 'path' => '/'])->assertStatus(422);
        $this->assertDatabaseCount('analytics_events', 0);
    }

    public function test_the_path_must_be_an_internal_page(): void
    {
        $this->collect(['name' => 'page_view', 'path' => 'https://evil.example/x'])->assertStatus(422);
        $this->collect(['name' => 'page_view', 'path' => '/'.str_repeat('a', 300)])->assertStatus(422);
        $this->assertDatabaseCount('analytics_events', 0);
    }

    public function test_the_query_string_is_never_stored(): void
    {
        $this->collect(['name' => 'page_view', 'path' => '/reset-password?token=secret&email=a@b.c'])->assertNoContent();

        $this->assertSame('/reset-password', AnalyticsEvent::sole()->path);
    }

    public function test_a_listing_view_needs_its_property_id(): void
    {
        $this->collect(['name' => 'listing_view', 'path' => '/properties/7'])->assertStatus(422);

        $this->collect(['name' => 'listing_view', 'path' => '/properties/7', 'property_id' => 7])->assertNoContent();
        $this->assertSame(7, AnalyticsEvent::sole()->property_id);
    }

    public function test_an_id_sent_with_an_unrelated_event_is_dropped(): void
    {
        $this->collect(['name' => 'page_view', 'path' => '/', 'property_id' => 7])->assertNoContent();

        $this->assertNull(AnalyticsEvent::sole()->property_id);
    }

    public function test_the_device_is_worked_out_by_the_server(): void
    {
        $this->collect(['name' => 'page_view', 'path' => '/', 'device' => 'desktop'], self::PHONE)->assertNoContent();

        $this->assertSame('mobile', AnalyticsEvent::sole()->device);
    }

    public function test_only_the_host_of_an_external_referrer_is_kept(): void
    {
        $this->collect([
            'name' => 'page_view',
            'path' => '/',
            'referrer' => 'https://www.google.com/search?q=location+marrakech',
            'utm_source' => 'Facebook',
            'is_entry' => true,
        ])->assertNoContent();

        $event = AnalyticsEvent::sole();
        $this->assertSame('google.com', $event->referrer_host);
        $this->assertSame('facebook', $event->utm_source);
    }

    public function test_a_referrer_from_krihouse_itself_is_not_a_source(): void
    {
        config()->set('app.frontend_url', 'https://krihouse.com');

        $this->collect(['name' => 'page_view', 'path' => '/', 'referrer' => 'https://www.krihouse.com/properties', 'is_entry' => true])->assertNoContent();

        $this->assertNull(AnalyticsEvent::sole()->referrer_host);
    }

    public function test_the_source_is_only_kept_on_the_first_page_of_a_visit(): void
    {
        $this->collect(['name' => 'page_view', 'path' => '/properties', 'referrer' => 'https://google.com/'])->assertNoContent();

        $event = AnalyticsEvent::sole();
        $this->assertFalse($event->is_entry);
        $this->assertNull($event->referrer_host);
    }

    public function test_a_contact_click_can_say_which_listing_it_was_on(): void
    {
        $this->collect(['name' => 'contact_click', 'path' => '/properties/5', 'property_id' => 5])->assertNoContent();
        $this->collect(['name' => 'contact_click', 'path' => '/roommates/8', 'roommate_listing_id' => 8])->assertNoContent();

        $this->assertSame([5, null], AnalyticsEvent::orderBy('id')->pluck('property_id')->all());
        $this->assertSame([null, 8], AnalyticsEvent::orderBy('id')->pluck('roommate_listing_id')->all());
    }

    public function test_bots_are_not_counted(): void
    {
        $this->collect(['name' => 'page_view', 'path' => '/'], 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
            ->assertNoContent();
        $this->collect(['name' => 'page_view', 'path' => '/'], '')->assertNoContent();

        $this->assertDatabaseCount('analytics_events', 0);
    }

    public function test_an_admin_browsing_the_site_is_not_counted(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->collect(['name' => 'page_view', 'path' => '/'])->assertNoContent();

        $this->assertDatabaseCount('analytics_events', 0);
    }

    public function test_a_logged_in_visit_is_flagged_but_not_linked_to_the_account(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->collect(['name' => 'favorite_add', 'path' => '/properties/3'])->assertNoContent();

        $event = AnalyticsEvent::sole();
        $this->assertTrue($event->is_authenticated);
        $this->assertArrayNotHasKey('user_id', $event->getAttributes());
    }

    public function test_the_language_comes_from_the_request(): void
    {
        $this->collect(['name' => 'page_view', 'path' => '/'], self::DESKTOP, ['Accept-Language' => 'ary'])->assertNoContent();

        $this->assertSame('ary', AnalyticsEvent::sole()->locale);
    }

    public function test_the_visitor_hash_is_stable_for_a_day_and_changes_the_next(): void
    {
        $service = app(AnalyticsService::class);

        $this->travelTo(now()->setTime(9, 0));
        $morning = $service->visitorHash('1.2.3.4', self::PHONE);
        $this->travelTo(now()->setTime(22, 0));
        $evening = $service->visitorHash('1.2.3.4', self::PHONE);
        $this->travelTo(now()->addDay());
        $tomorrow = $service->visitorHash('1.2.3.4', self::PHONE);

        $this->assertSame($morning, $evening);
        $this->assertNotSame($morning, $tomorrow);
        $this->assertStringNotContainsString('1.2.3.4', $morning);
    }

    public function test_collecting_is_rate_limited(): void
    {
        for ($i = 0; $i < 120; $i++) {
            $this->collect(['name' => 'page_view', 'path' => '/']);
        }

        $this->collect(['name' => 'page_view', 'path' => '/'])->assertStatus(429);
    }
}
