<?php

namespace Tests\Feature\Properties;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Who can see an owner's phone number.
 *
 * This is a privacy rule, so every branch is pinned. A regression here
 * does not throw an error or break a page — it silently publishes
 * people's phone numbers. Tests are the only thing that would notice.
 *
 * Phase 29 (monetization overhaul) added a paywall on top of the existing
 * consent rule: opting in + being a verified viewer used to be enough to
 * see the number for free; now the viewer must also pay the phone-reveal
 * fee (5 MAD by default) for THAT listing specifically — and, since the
 * paywall no longer depends on rental_type, a short-term listing can show
 * a number too, which it never could before.
 */
class OwnerPhoneVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private const PHONE = '0612345678';

    private function consentingOwner(): User
    {
        return User::factory()->create([
            'phone' => self::PHONE,
            'show_phone_on_listings' => true,
        ]);
    }

    private function longTermListingOf(User $owner): Property
    {
        return Property::factory()->longTerm()->for($owner, 'owner')->create();
    }

    /**
     * @return array<string, mixed>
     */
    private function show(Property $property): array
    {
        return $this->getJson("/api/v1/properties/{$property->id}")
            ->assertOk()
            ->json('property');
    }

    /** Completes a full phone-reveal payment for the CURRENTLY acting user. */
    private function revealPhoneNumber(Property $property): void
    {
        $started = $this->postJson("/api/v1/properties/{$property->id}/phone-reveal")
            ->assertCreated()
            ->json();

        $this->get("/api/v1/payments/{$started['payment']['id']}/return")->assertRedirect();
    }

    public function test_a_verified_visitor_must_pay_to_reveal_the_number(): void
    {
        $property = $this->longTermListingOf($this->consentingOwner());

        Sanctum::actingAs(User::factory()->create());

        // Before paying: the page can say a number exists, but not what
        // it is.
        $before = $this->show($property);
        $this->assertTrue($before['owner_phone_available']);
        $this->assertFalse($before['owner_phone_unlocked']);
        $this->assertNull($before['owner_phone']);

        $this->revealPhoneNumber($property);

        $after = $this->show($property);
        $this->assertTrue($after['owner_phone_unlocked']);
        $this->assertSame(self::PHONE, $after['owner_phone']);
    }

    public function test_paying_to_reveal_the_number_twice_is_refused(): void
    {
        $property = $this->longTermListingOf($this->consentingOwner());
        Sanctum::actingAs(User::factory()->create());

        $this->revealPhoneNumber($property);

        $this->postJson("/api/v1/properties/{$property->id}/phone-reveal")
            ->assertStatus(409);
    }

    public function test_an_owner_cannot_pay_to_reveal_their_own_number(): void
    {
        $owner = $this->consentingOwner();
        $property = $this->longTermListingOf($owner);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/properties/{$property->id}/phone-reveal")
            ->assertStatus(409);
    }

    public function test_a_short_term_listing_can_show_the_number_once_revealed(): void
    {
        // Phase 29: the paywall no longer depends on rental_type — before
        // this it never could, whatever the owner wanted.
        $owner = $this->consentingOwner();
        $property = Property::factory()->shortTerm()->for($owner, 'owner')->create();

        Sanctum::actingAs(User::factory()->create());

        $this->assertTrue($this->show($property)['owner_phone_available']);

        $this->revealPhoneNumber($property);

        $this->assertSame(self::PHONE, $this->show($property)['owner_phone']);
    }

    public function test_an_anonymous_visitor_is_told_a_number_exists_but_not_what_it_is(): void
    {
        // Anti-scraping: the number never reaches a public, anonymous
        // response — there is not even a way for an anonymous visitor to
        // pay to reveal it (the endpoint requires auth:sanctum+verified).
        $property = $this->longTermListingOf($this->consentingOwner());

        $data = $this->show($property);

        $this->assertTrue($data['owner_phone_available']);
        $this->assertFalse($data['owner_phone_unlocked']);
        $this->assertNull($data['owner_phone']);
    }

    public function test_an_unverified_account_does_not_see_the_number(): void
    {
        // A throwaway account is free to create — that is what a scraper
        // would use. Verified email is the bar, and the phone-reveal
        // route itself sits behind the same 'verified' middleware.
        $property = $this->longTermListingOf($this->consentingOwner());

        Sanctum::actingAs(User::factory()->unverified()->create());

        $this->assertNull($this->show($property)['owner_phone']);
    }

    public function test_an_owner_who_did_not_opt_in_shows_nothing(): void
    {
        // Off by default. The number was given to create an account,
        // not to be published — no amount of paying can reveal what was
        // never listed in the first place.
        $owner = User::factory()->create(['phone' => self::PHONE]);
        $property = $this->longTermListingOf($owner);

        Sanctum::actingAs(User::factory()->create());

        $data = $this->show($property);

        $this->assertFalse($data['owner_phone_available']);
        $this->assertNull($data['owner_phone']);

        $this->postJson("/api/v1/properties/{$property->id}/phone-reveal")
            ->assertStatus(409);
    }

    public function test_opting_in_without_a_number_shows_nothing(): void
    {
        $owner = User::factory()->create([
            'phone' => null,
            'show_phone_on_listings' => true,
        ]);
        $property = $this->longTermListingOf($owner);

        Sanctum::actingAs(User::factory()->create());

        $this->assertFalse($this->show($property)['owner_phone_available']);
    }

    public function test_the_owner_block_never_leaks_email_or_phone(): void
    {
        // The trap this feature almost walked into. The owner used to be
        // serialized through UserResource, which carries email AND phone,
        // and was safe only because the query selected owner:id,name.
        // show() now loads the phone — so if `owner` ever goes back to
        // UserResource, this test is what catches it.
        $property = $this->longTermListingOf($this->consentingOwner());

        Sanctum::actingAs(User::factory()->create());

        $owner = $this->show($property)['owner'];

        // avatar_url is public by design; email and phone must never appear.
        $this->assertSame(['id', 'name', 'avatar_url'], array_keys($owner));
    }

    public function test_the_public_listing_index_never_carries_a_number(): void
    {
        // The index only loads owner:id,name, so listsOwnerPhone() reads
        // nulls and returns false. The number is only ever on the
        // details page.
        $this->longTermListingOf($this->consentingOwner());

        Sanctum::actingAs(User::factory()->create());

        $row = $this->getJson('/api/v1/properties')->assertOk()->json('data.0');

        $this->assertNull($row['owner_phone']);
    }

    public function test_an_owner_can_opt_in_and_later_remove_their_number(): void
    {
        $owner = User::factory()->create(['phone' => self::PHONE]);
        Sanctum::actingAs($owner);

        $this->putJson('/api/v1/auth/profile', [
            'name' => $owner->name,
            'phone' => self::PHONE,
            'show_phone_on_listings' => true,
        ])->assertOk();

        $this->assertTrue($owner->fresh()->show_phone_on_listings);

        // Sending null must actually clear the number. The frontend used
        // to send `undefined` for an emptied field, which dropped the key
        // and made a number impossible to remove.
        $this->putJson('/api/v1/auth/profile', [
            'name' => $owner->name,
            'phone' => null,
        ])->assertOk();

        $this->assertNull($owner->fresh()->phone);
    }

    public function test_the_number_is_free_while_kridar_is_free(): void
    {
        // Same treatment as the publication fee: while payments.enabled
        // is false, every paywall in the app steps aside — a verified
        // viewer sees the number without ever paying to reveal it.
        config()->set('payments.enabled', false);

        $property = $this->longTermListingOf($this->consentingOwner());
        Sanctum::actingAs(User::factory()->create());

        $data = $this->show($property);

        $this->assertTrue($data['owner_phone_unlocked']);
        $this->assertSame(self::PHONE, $data['owner_phone']);
    }
}
