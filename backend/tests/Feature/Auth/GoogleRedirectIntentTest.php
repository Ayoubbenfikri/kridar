<?php

namespace Tests\Feature\Auth;

use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Phase O1 (owner UX): "Continue with Google" brings the person back to
 * the page they were trying to open (e.g. /owner/properties/new), and only
 * ever to a page of our own site.
 */
class GoogleRedirectIntentTest extends TestCase
{
    use RefreshDatabase;

    private const SESSION_KEY = 'google_auth_redirect';

    private function fakeGoogleUser(User $user): void
    {
        $googleUser = (new SocialiteUser)->setRaw([
            'sub' => $user->google_id,
            'email' => $user->email,
            'email_verified' => true,
        ])->map([
            'id' => $user->google_id,
            'name' => $user->name,
            'email' => $user->email,
        ]);

        Socialite::shouldReceive('driver->user')->andReturn($googleUser);
    }

    public function test_the_redirect_remembers_a_safe_target_in_the_session(): void
    {
        Socialite::shouldReceive('driver->redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));

        $this->get('/api/v1/auth/google/redirect?redirect=%2Fowner%2Fproperties%2Fnew')
            ->assertRedirect('https://accounts.google.com/o/oauth2/auth')
            ->assertSessionHas(self::SESSION_KEY, '/owner/properties/new');
    }

    public function test_the_callback_sends_the_person_back_to_that_page(): void
    {
        $user = User::factory()->create(['google_id' => 'google-123']);
        $this->fakeGoogleUser($user);

        $this->withSession([self::SESSION_KEY => '/owner/properties/new'])
            ->get('/api/v1/auth/google/callback')
            ->assertRedirect(rtrim(config('app.frontend_url'), '/').'/owner/properties/new');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_without_a_target_the_callback_goes_home(): void
    {
        $user = User::factory()->create(['google_id' => 'google-123']);
        $this->fakeGoogleUser($user);

        $this->get('/api/v1/auth/google/callback')
            ->assertRedirect(rtrim(config('app.frontend_url'), '/').'/');
    }

    public function test_a_failure_keeps_the_target_on_the_login_page(): void
    {
        Socialite::shouldReceive('driver->user')->andThrow(new \RuntimeException('state mismatch'));

        $this->withSession([self::SESSION_KEY => '/owner/properties/new'])
            ->get('/api/v1/auth/google/callback')
            ->assertRedirect(rtrim(config('app.frontend_url'), '/').'/login?error=google_auth_failed&redirect=%2Fowner%2Fproperties%2Fnew');
    }

    /**
     * @return array<string, array{0: mixed}>
     */
    public static function unsafeTargets(): array
    {
        return [
            'another site' => ['https://evil.com'],
            'protocol-relative' => ['//evil.com/owner'],
            'backslash trick' => ['/\\evil.com'],
            'javascript' => ['javascript:alert(1)'],
            'no leading slash' => ['owner/properties/new'],
            'auth loop' => ['/login?redirect=/owner'],
            'just home' => ['/'],
            'not a string' => [['/owner']],
        ];
    }

    #[DataProvider('unsafeTargets')]
    public function test_unsafe_targets_are_refused(mixed $target): void
    {
        $this->assertNull(GoogleAuthController::safeRedirectPath($target));
    }

    public function test_an_unsafe_target_is_never_stored(): void
    {
        Socialite::shouldReceive('driver->redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));

        $this->get('/api/v1/auth/google/redirect?redirect=https%3A%2F%2Fevil.com')
            ->assertSessionMissing(self::SESSION_KEY);
    }
}
