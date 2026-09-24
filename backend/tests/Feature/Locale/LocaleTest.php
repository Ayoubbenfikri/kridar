<?php

namespace Tests\Feature\Locale;

use App\Enums\Locale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Which language the API answers in.
 *
 * These tests deliberately compare against trans(key, [], 'xx') rather
 * than against literal French or Darija sentences. What is being tested is
 * the PLUMBING — did the middleware pick the right lang file — not the
 * wording. Ayoub can rewrite every string in lang/ary/messages.php without
 * a single test turning red, which is the point: translations are meant to
 * be edited by whoever speaks the language.
 *
 * ONE THING TO KNOW BEFORE READING THE HEADERS BELOW
 * --------------------------------------------------
 * There is no such thing as a request with no Accept-Language. Symfony's
 * Request::create() — which every $this->getJson() goes through — injects
 * "en-us,en;q=0.5" by default, exactly as a real browser injects the
 * operating system's language. That is not a testing quirk to work
 * around; it is the production reality, and it is what proved the original
 * priority order wrong (the header beat the user's saved language, so the
 * saved language was unreachable).
 *
 * So: passing Accept-Language => '' is how a test says "the caller
 * expressed no preference", and passing a real value is how it says "this
 * is what the browser or the app asked for".
 */
class LocaleTest extends TestCase
{
    use RefreshDatabase;

    /** What Symfony puts on every request unless a test says otherwise. */
    private const BROWSER_DEFAULT = ['Accept-Language' => 'en-us,en;q=0.5'];

    /** Explicitly no preference — not the same as omitting the key. */
    private const NO_PREFERENCE = ['Accept-Language' => ''];

    /**
     * A probe that needs no session and no account: a failed login. It
     * returns early, before login() touches the session, so it works on
     * the array session driver the test suite uses.
     *
     * @param  array<string, string>  $headers
     */
    private function failedLoginMessage(array $headers): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@kridar.test',
            'password' => 'wrong-password',
        ], $headers)
            ->assertStatus(401)
            ->json('message');
    }

    /**
     * A probe for an AUTHENTICATED request: a normal user hitting the
     * admin API. EnsureUserIsAdmin's refusal goes through __() too.
     *
     * @param  array<string, string>  $headers
     */
    private function forbiddenMessage(array $headers): string
    {
        return $this->getJson('/api/v1/admin/stats', $headers)
            ->assertStatus(403)
            ->json('message');
    }

    private function expected(string $key, Locale $locale): string
    {
        return trans($key, [], $locale->value);
    }

    // ---------------------------------------------------------------
    // No account — the header decides
    // ---------------------------------------------------------------

    public function test_french_is_the_default_when_nothing_is_asked_for(): void
    {
        // Kridar is a Moroccan product written in French, so French is the
        // fallback rather than English.
        $this->assertSame(
            $this->expected('messages.auth.invalid_credentials', Locale::Fr),
            $this->failedLoginMessage(self::NO_PREFERENCE),
        );
    }

    public function test_the_header_selects_english(): void
    {
        $this->assertSame(
            $this->expected('messages.auth.invalid_credentials', Locale::En),
            $this->failedLoginMessage(['Accept-Language' => 'en']),
        );
    }

    public function test_the_header_selects_darija(): void
    {
        $this->assertSame(
            $this->expected('messages.auth.invalid_credentials', Locale::Ary),
            $this->failedLoginMessage(['Accept-Language' => 'ary']),
        );
    }

    public function test_an_unsupported_language_falls_back_instead_of_breaking(): void
    {
        // A real browser sends whatever the OS is set to. "de-DE" must not
        // reach App::setLocale() — it would silently look for lang/de-DE
        // and serve keys as literal strings.
        $this->assertSame(
            $this->expected('messages.auth.invalid_credentials', Locale::Fr),
            $this->failedLoginMessage(['Accept-Language' => 'de-DE']),
        );
    }

    public function test_a_ranked_header_picks_the_first_language_we_actually_have(): void
    {
        // Accept-Language is a ranked list. German first, then Darija:
        // the answer should be Darija, not the French default.
        $this->assertSame(
            $this->expected('messages.auth.invalid_credentials', Locale::Ary),
            $this->failedLoginMessage(['Accept-Language' => 'de-DE,ary;q=0.9,en;q=0.8']),
        );
    }

    public function test_a_regional_tag_resolves_through_its_bare_language(): void
    {
        // "en-US" is not in the enum, but every real browser follows it
        // with the bare "en", which is. This is the shape Chrome actually
        // sends, so it is worth pinning.
        $this->assertSame(
            $this->expected('messages.auth.invalid_credentials', Locale::En),
            $this->failedLoginMessage(['Accept-Language' => 'en-US,en;q=0.9']),
        );
    }

    // ---------------------------------------------------------------
    // With an account — the stored locale wins
    // ---------------------------------------------------------------

    public function test_a_logged_in_user_gets_their_stored_language(): void
    {
        $user = User::factory()->create(['locale' => Locale::Ary]);

        Sanctum::actingAs($user);

        $this->assertSame(
            $this->expected('messages.admin.forbidden', Locale::Ary),
            $this->forbiddenMessage(self::NO_PREFERENCE),
        );
    }

    public function test_the_stored_language_beats_the_browsers_own(): void
    {
        // THE REGRESSION TEST. This is the bug the first version shipped:
        // the header won, every browser sends one filled in from the OS,
        // so a user who chose Darija got whatever language their laptop
        // was in. Their saved choice was unreachable in practice.
        $user = User::factory()->create(['locale' => Locale::Ary]);

        Sanctum::actingAs($user);

        $this->assertSame(
            $this->expected('messages.admin.forbidden', Locale::Ary),
            $this->forbiddenMessage(self::BROWSER_DEFAULT),
        );
    }

    public function test_a_guest_still_gets_the_language_their_browser_asked_for(): void
    {
        // The other half of that decision: with no account there is
        // nothing to override the header, so it is honoured.
        $this->assertSame(
            $this->expected('messages.auth.invalid_credentials', Locale::En),
            $this->failedLoginMessage(self::BROWSER_DEFAULT),
        );
    }

    // ---------------------------------------------------------------
    // Persisting the choice
    // ---------------------------------------------------------------

    public function test_a_user_can_save_their_language(): void
    {
        $user = User::factory()->create(['locale' => Locale::Fr]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/auth/locale', ['locale' => 'ary'])
            ->assertOk()
            ->assertJsonPath('user.locale', 'ary');

        $this->assertSame(Locale::Ary, $user->fresh()->locale);
    }

    public function test_an_invalid_language_is_refused(): void
    {
        // users.locale is 8 characters wide, so "zz" would store happily
        // and then fall back silently on every read — which looks like
        // "the language does not save" and has nothing to do with the
        // frontend. Rule::enum is what stops it here.
        $user = User::factory()->create(['locale' => Locale::Fr]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/auth/locale', ['locale' => 'zz'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('locale');

        $this->assertSame(Locale::Fr, $user->fresh()->locale);
    }

    public function test_changing_the_language_does_not_touch_anything_else(): void
    {
        // The whole reason this is not a field on PUT /auth/profile: that
        // endpoint requires `name`, and a partial profile update is how a
        // phone number or a consent flag gets silently wiped.
        $user = User::factory()->create([
            'locale' => Locale::Fr,
            'phone' => '0612345678',
            'show_phone_on_listings' => true,
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/auth/locale', ['locale' => 'en'])->assertOk();

        $fresh = $user->fresh();

        $this->assertSame(Locale::En, $fresh->locale);
        $this->assertSame($user->name, $fresh->name);
        $this->assertSame('0612345678', $fresh->phone);
        $this->assertTrue($fresh->show_phone_on_listings);
    }

    public function test_a_guest_cannot_save_a_language(): void
    {
        $this->putJson('/api/v1/auth/locale', ['locale' => 'en'])->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // The enum itself
    // ---------------------------------------------------------------

    public function test_only_darija_is_right_to_left(): void
    {
        // The frontend reads direction from the locale rather than keeping
        // its own list, so this is the single source of that fact.
        $this->assertTrue(Locale::Ary->isRtl());
        $this->assertSame('rtl', Locale::Ary->direction());

        $this->assertFalse(Locale::Fr->isRtl());
        $this->assertFalse(Locale::En->isRtl());
        $this->assertSame('ltr', Locale::Fr->direction());
    }

    public function test_every_language_has_the_same_message_keys(): void
    {
        // A key present in one file and missing in another falls back
        // silently and ships an untranslated sentence to a real user.
        // Nothing else would notice — so this does.
        $reference = array_keys(data_get(trans('messages', [], Locale::Fr->value), 'auth'));

        foreach (Locale::cases() as $locale) {
            $keys = array_keys(data_get(trans('messages', [], $locale->value), 'auth'));

            $this->assertSame(
                $reference,
                $keys,
                "lang/{$locale->value}/messages.php has different auth keys to French.",
            );
        }
    }
}
