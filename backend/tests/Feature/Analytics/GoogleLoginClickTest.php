<?php

namespace Tests\Feature\Analytics;

use App\Enums\AnalyticsEventName;
use App\Models\AnalyticsEvent;
use App\Services\AnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;
use Tests\TestCase;

/**
 * "Continue with Google" is counted by the backend, inside
 * GET /auth/google/redirect - not by a separate analytics request from the
 * browser, which raced the redirect on the session and could wipe
 * Socialite's OAuth state ("Google sign-in failed").
 */
class GoogleLoginClickTest extends TestCase
{
    use RefreshDatabase;

    private const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0';

    protected function setUp(): void
    {
        parent::setUp();

        Socialite::shouldReceive('driver->redirect')
            ->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));
    }

    public function test_the_redirect_records_one_google_login_click_with_the_page_path(): void
    {
        $this->withHeaders([
            'User-Agent' => self::BROWSER,
            'Referer' => 'https://krihouse.com/register?from=home',
        ])->get('/api/v1/auth/google/redirect')
            ->assertRedirect('https://accounts.google.com/o/oauth2/auth');

        $event = AnalyticsEvent::sole();
        $this->assertSame(AnalyticsEventName::GoogleLoginClick, $event->name);
        $this->assertSame('/register', $event->path);
        $this->assertFalse($event->is_entry);
    }

    public function test_a_bot_is_still_redirected_but_not_counted(): void
    {
        $this->withHeaders(['User-Agent' => 'curl/8.0'])
            ->get('/api/v1/auth/google/redirect')
            ->assertRedirect('https://accounts.google.com/o/oauth2/auth');

        $this->assertSame(0, AnalyticsEvent::count());
    }

    public function test_an_analytics_failure_never_blocks_the_sign_in(): void
    {
        $this->mock(AnalyticsService::class)
            ->shouldReceive('record')
            ->andThrow(new RuntimeException('database is down'));

        $this->withHeaders(['User-Agent' => self::BROWSER])
            ->get('/api/v1/auth/google/redirect')
            ->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }
}
