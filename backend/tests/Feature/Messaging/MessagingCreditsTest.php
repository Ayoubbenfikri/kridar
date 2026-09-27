<?php

namespace Tests\Feature\Messaging;

use App\Models\Conversation;
use App\Models\MessagingPass;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 29 (monetization overhaul) — "1 credit = 1 NEW conversation, never
 * per message". This is the file that pins the rule with the sharpest
 * teeth in the whole spec: a user gets exactly 5 free contacts, replying
 * is always free forever, and a pack removes the limit entirely for a
 * fixed number of days.
 */
class MessagingCreditsTest extends TestCase
{
    use RefreshDatabase;

    private function publishedListing(): Property
    {
        return Property::factory()->shortTerm()->create(); // random owner
    }

    private function send(Property $property, string $body = 'Bonjour'): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/conversations', [
            'property_id' => $property->id,
            'body' => $body,
        ]);
    }

    public function test_the_first_five_new_conversations_are_free(): void
    {
        $guest = User::factory()->create();
        Sanctum::actingAs($guest);

        for ($i = 0; $i < 5; $i++) {
            $this->send($this->publishedListing())->assertCreated();
        }

        $this->assertSame(0, $guest->fresh()->free_contacts_remaining);
    }

    public function test_the_sixth_new_conversation_is_refused_without_a_pack(): void
    {
        $guest = User::factory()->withNoFreeContacts()->create();
        Sanctum::actingAs($guest);

        // 402 Payment Required — the frontend needs "pay to continue"
        // apart from a plain "you cannot do this" (409).
        $this->send($this->publishedListing())->assertStatus(402);

        $this->assertDatabaseCount('conversations', 0);
    }

    public function test_replying_stays_free_even_after_every_credit_is_spent(): void
    {
        $guest = User::factory()->create();
        $property = $this->publishedListing();

        Sanctum::actingAs($guest);
        $this->send($property)->assertCreated();
        $conversation = Conversation::firstOrFail();

        // Burn the rest of the free contacts on OTHER listings.
        for ($i = 0; $i < 4; $i++) {
            $this->send($this->publishedListing())->assertCreated();
        }
        $this->assertSame(0, $guest->fresh()->free_contacts_remaining);

        // Continuing the FIRST thread never touches the credit count —
        // it is a reply, not a new conversation.
        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'Toujours la ?',
        ])->assertCreated();

        $this->assertSame(0, $guest->fresh()->free_contacts_remaining);
    }

    public function test_writing_again_to_the_same_listing_never_spends_a_second_credit(): void
    {
        // find-or-create means "message a second time" is a reply, not a
        // new conversation, even through the /conversations endpoint.
        $guest = User::factory()->create();
        $property = $this->publishedListing();

        Sanctum::actingAs($guest);
        $this->send($property, 'Premier message')->assertCreated();
        $this->send($property, 'Deuxieme message')->assertCreated();

        $this->assertSame(4, $guest->fresh()->free_contacts_remaining);
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_an_active_pass_allows_unlimited_new_conversations_without_touching_free_contacts(): void
    {
        $guest = User::factory()->withNoFreeContacts()->create();

        MessagingPass::create([
            'user_id' => $guest->id,
            'duration_days' => 7,
            'starts_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        Sanctum::actingAs($guest);

        for ($i = 0; $i < 3; $i++) {
            $this->send($this->publishedListing())->assertCreated();
        }

        $this->assertSame(0, $guest->fresh()->free_contacts_remaining);
    }

    public function test_an_expired_pass_falls_back_to_free_contacts(): void
    {
        $guest = User::factory()->create(); // 5 free contacts

        MessagingPass::create([
            'user_id' => $guest->id,
            'duration_days' => 7,
            'starts_at' => now()->subDays(10),
            'expires_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($guest);

        $this->send($this->publishedListing())->assertCreated();

        // The expired pass did not cover it — a free contact was spent
        // instead, exactly as if the pass did not exist.
        $this->assertSame(4, $guest->fresh()->free_contacts_remaining);
    }

    public function test_messaging_is_unlimited_while_kridar_is_free(): void
    {
        // Same treatment as every other paywall: while payments.enabled
        // is false, the 5-contact limit does not exist at all — matters
        // because there would otherwise be no way to buy a pack either.
        config()->set('payments.enabled', false);

        $guest = User::factory()->withNoFreeContacts()->create();
        Sanctum::actingAs($guest);

        for ($i = 0; $i < 3; $i++) {
            $this->send($this->publishedListing())->assertCreated();
        }
    }

    public function test_a_failed_conversation_never_spends_a_credit(): void
    {
        // The unique(property_id, guest_id) constraint is the guard
        // against two parallel requests both creating a conversation for
        // the same listing; this proves the credit survives that failure
        // even though we cannot easily fire two requests at once in a
        // single-process test. What we CAN prove directly: an attempt
        // that never reaches the create() call (draft listing => 409)
        // must never touch free_contacts_remaining either.
        $owner = User::factory()->create();
        $property = Property::factory()->shortTerm()->draft()->for($owner, 'owner')->create();

        $guest = User::factory()->create();
        Sanctum::actingAs($guest);

        $this->send($property)->assertStatus(409);

        $this->assertSame(5, $guest->fresh()->free_contacts_remaining);
    }
}
