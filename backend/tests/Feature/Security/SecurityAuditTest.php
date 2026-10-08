<?php

namespace Tests\Feature\Security;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\PropertyStatus;
use App\Enums\ReservationStatus;
use App\Enums\RoommateListingStatus;
use App\Enums\RoommateListingType;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\RoommateListing;
use App\Models\User;
use App\Services\Gateways\PaymentGatewayInterface;
use App\Services\Gateways\UnavailableGateway;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

/**
 * Regression tests for the October 2026 security audit. Each test was
 * written to FAIL against the code before its fix, and to pass after it.
 */
class SecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Favorites: reading another owner's unpublished listing
    // ------------------------------------------------------------------

    public function test_a_user_cannot_favorite_someone_elses_draft(): void
    {
        $draft = Property::factory()->draft()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/v1/favorites/{$draft->id}")->assertForbidden();
        $this->assertDatabaseCount('favorites', 0);
    }

    public function test_the_favorites_list_never_leaks_an_unpublished_listing(): void
    {
        $user = User::factory()->create();
        $property = Property::factory()->create(); // published
        Sanctum::actingAs($user);
        $this->postJson("/api/v1/favorites/{$property->id}")->assertCreated();

        // The owner takes it down afterwards (draft, then suspended).
        $property->update(['status' => PropertyStatus::Draft, 'description' => str_repeat('secret ', 5)]);

        $this->getJson('/api/v1/favorites')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_the_owner_still_sees_their_own_favorited_draft(): void
    {
        $owner = User::factory()->create();
        $property = Property::factory()->draft()->create(['owner_id' => $owner->id]);
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/favorites/{$property->id}")->assertCreated();
        $this->getJson('/api/v1/favorites')->assertOk()->assertJsonCount(1, 'data');
    }

    // ------------------------------------------------------------------
    // Payments: the "fake" gateway must never run in production
    // ------------------------------------------------------------------

    private function pendingPhoneRevealPayment(): Payment
    {
        $property = Property::factory()->create();

        return Payment::create([
            'type' => PaymentType::PhoneReveal,
            'property_id' => $property->id,
            'user_id' => User::factory()->create()->id,
            'amount' => 20,
            'currency' => 'MAD',
            'provider' => PaymentProvider::Cmi,
            'status' => PaymentStatus::Pending,
        ]);
    }

    public function test_the_fake_gateway_cannot_mark_a_payment_paid_in_production(): void
    {
        $payment = $this->pendingPhoneRevealPayment();
        $this->app['env'] = 'production';
        config()->set('payments.gateway', 'fake');

        // Anyone can hit this public URL. With the fake gateway it used to
        // flip the payment to "paid" without any money moving.
        $this->get("/api/v1/payments/{$payment->id}/return");

        $this->assertNotSame(PaymentStatus::Paid, $payment->fresh()->status);
        $this->assertDatabaseCount('phone_reveals', 0);
    }

    public function test_a_misspelled_gateway_does_not_silently_fall_back_to_the_fake_one(): void
    {
        config()->set('payments.gateway', 'paypall');

        $this->assertInstanceOf(UnavailableGateway::class, app(PaymentGatewayInterface::class));

        $payment = $this->pendingPhoneRevealPayment();
        $this->get("/api/v1/payments/{$payment->id}/return")->assertRedirect();
        $this->assertNotSame(PaymentStatus::Paid, $payment->fresh()->status);
    }

    public function test_a_late_failed_callback_cannot_overwrite_a_paid_payment(): void
    {
        $stale = $this->pendingPhoneRevealPayment();

        // Another request (the other tab, a retried redirect...) settled it
        // in the meantime. $stale still says "pending" in memory.
        Payment::whereKey($stale->id)->update(['status' => PaymentStatus::Paid->value, 'paid_at' => now()]);

        app(PaymentService::class)->handleCallback($stale, Request::create('/', 'GET', ['success' => 0]));

        $this->assertSame(PaymentStatus::Paid, $stale->fresh()->status);
    }

    // ------------------------------------------------------------------
    // Rate limits / calendar abuse
    // ------------------------------------------------------------------

    public function test_registration_is_rate_limited(): void
    {
        RateLimiter::clear('');
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/register', [])->assertStatus(422);
        }

        $this->postJson('/api/v1/auth/register', [])->assertStatus(429);
    }

    public function test_a_guest_cannot_hold_a_property_with_several_pending_requests(): void
    {
        $property = Property::factory()->shortTerm()->create(['max_guests' => 4]);
        $guest = User::factory()->create();
        Sanctum::actingAs($guest);

        $book = fn (string $start, string $end) => $this->postJson('/api/v1/reservations', [
            'property_id' => $property->id,
            'rental_type' => 'short_term',
            'start_date' => $start,
            'end_date' => $end,
            'guests_count' => 1,
        ]);

        foreach ([10, 20, 30] as $day) {
            $book(now()->addDays($day)->toDateString(), now()->addDays($day + 2)->toDateString())->assertCreated();
        }
        $book(now()->addDays(40)->toDateString(), now()->addDays(42)->toDateString())->assertStatus(422);

        $this->assertSame(3, Reservation::where('guest_id', $guest->id)->where('status', ReservationStatus::Pending)->count());
    }

    public function test_one_request_cannot_block_a_calendar_for_years(): void
    {
        $property = Property::factory()->shortTerm()->create(['max_guests' => 4]);
        Sanctum::actingAs(User::factory()->create());

        $request = fn (int $startInDays, int $nights) => $this->postJson('/api/v1/reservations', [
            'property_id' => $property->id,
            'rental_type' => 'short_term',
            'start_date' => now()->addDays($startInDays)->toDateString(),
            'end_date' => now()->addDays($startInDays + $nights)->toDateString(),
            'guests_count' => 1,
        ]);

        $request(5, 3650)->assertStatus(422)->assertJsonValidationErrors('end_date');   // 10-year "stay"
        $request(3 * 365, 2)->assertStatus(422)->assertJsonValidationErrors('start_date'); // 3 years ahead
        $request(5, 30)->assertCreated();                                                // a normal month
    }

    public function test_a_cancellation_reason_must_be_text(): void
    {
        $reservation = Reservation::factory()->create();
        Sanctum::actingAs($reservation->guest);

        $this->patchJson("/api/v1/reservations/{$reservation->id}/cancel", ['reason' => ['not', 'text']])
            ->assertStatus(422);
    }

    // ------------------------------------------------------------------
    // Moderation: suspending a user hides ALL their public posts
    // ------------------------------------------------------------------

    public function test_suspending_a_user_also_suspends_their_roommate_posts(): void
    {
        $user = User::factory()->create();
        $listing = RoommateListing::create([
            'user_id' => $user->id,
            'type' => RoommateListingType::Request,
            'title' => 'Looking for a room',
            'description' => str_repeat('A quiet student. ', 3),
            'city' => 'Rabat',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'currency' => 'MAD',
            'status' => RoommateListingStatus::Published,
            'published_at' => now(),
        ]);

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->patchJson("/api/v1/admin/users/{$user->id}/suspend")->assertOk();

        $this->assertSame(RoommateListingStatus::Suspended, $listing->fresh()->status);

        // ...and no longer visible to an ordinary visitor.
        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/roommate-listings/{$listing->id}")->assertForbidden();
    }

    // ------------------------------------------------------------------
    // Reviews: public endpoint exposure
    // ------------------------------------------------------------------

    public function test_reviews_of_an_unpublished_property_are_not_public(): void
    {
        $review = Review::factory()->create();
        $review->property->update(['status' => PropertyStatus::Draft]);

        $this->getJson("/api/v1/properties/{$review->property_id}/reviews")->assertForbidden();
    }

    public function test_the_public_review_list_only_exposes_the_reviewers_name(): void
    {
        $review = Review::factory()->create();

        $guest = $this->getJson("/api/v1/properties/{$review->property_id}/reviews")
            ->assertOk()
            ->json('data.0.guest');

        $this->assertSame(['id', 'name', 'avatar_url'], array_keys($guest));
    }

    // ------------------------------------------------------------------
    // Google sign-in: never link an account on an unverified Google email
    // ------------------------------------------------------------------

    public function test_google_sign_in_does_not_take_over_an_account_with_an_unverified_google_email(): void
    {
        $victim = User::factory()->create(['email' => 'victim@example.com']);

        $googleUser = (new SocialiteUser)->setRaw([
            'sub' => 'attacker-google-id',
            'email' => 'victim@example.com',
            'email_verified' => false,
        ])->map([
            'id' => 'attacker-google-id',
            'name' => 'Attacker',
            'email' => 'victim@example.com',
        ]);
        Socialite::shouldReceive('driver->user')->andReturn($googleUser);

        $this->get('/api/v1/auth/google/callback')->assertRedirect();

        $this->assertNull($victim->fresh()->google_id);
        $this->assertGuest('web');
    }

    // ------------------------------------------------------------------
    // HTTP hardening headers on API responses
    // ------------------------------------------------------------------

    public function test_api_responses_carry_security_headers(): void
    {
        $this->getJson('/api/v1/ping')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
