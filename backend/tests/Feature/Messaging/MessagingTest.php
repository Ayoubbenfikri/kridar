<?php

namespace Tests\Feature\Messaging;

use App\Models\Conversation;
use App\Models\Property;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Messaging is the one feature where any user can reach any other user,
 * so most of what matters here is what is REFUSED.
 */
class MessagingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Property}
     */
    private function publishedListing(): array
    {
        $owner = User::factory()->create();
        $property = Property::factory()->shortTerm()->for($owner, 'owner')->create();

        return [$owner, $property];
    }

    private function send(Property $property, string $body = 'Bonjour, est-ce disponible ?'): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/conversations', [
            'property_id' => $property->id,
            'body' => $body,
        ]);
    }

    public function test_a_visitor_can_open_a_thread_on_a_published_listing(): void
    {
        [, $property] = $this->publishedListing();
        Sanctum::actingAs(User::factory()->create());

        $this->send($property)->assertCreated();

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 1);
    }

    public function test_writing_twice_reuses_the_same_thread(): void
    {
        // unique(property_id, guest_id) makes this a find-or-create.
        // Without it the owner would get a second thread in their inbox
        // for every message the same person sends.
        [, $property] = $this->publishedListing();
        Sanctum::actingAs(User::factory()->create());

        $this->send($property, 'Premier message')->assertCreated();
        $this->send($property, 'Deuxieme message')->assertCreated();

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 2);
    }

    public function test_an_unpublished_listing_cannot_be_contacted_about(): void
    {
        // A draft is not offered to anyone, so there is nothing to ask
        // about — and allowing it would leak that the listing exists.
        $owner = User::factory()->create();
        $property = Property::factory()->shortTerm()->draft()->for($owner, 'owner')->create();

        Sanctum::actingAs(User::factory()->create());

        $this->send($property)->assertStatus(409);
        $this->assertDatabaseCount('conversations', 0);
    }

    public function test_an_owner_cannot_open_a_thread_on_their_own_listing(): void
    {
        [$owner, $property] = $this->publishedListing();
        Sanctum::actingAs($owner);

        $this->send($property)->assertStatus(409);
    }

    public function test_someone_outside_the_thread_cannot_read_it(): void
    {
        [, $property] = $this->publishedListing();

        $guest = User::factory()->create();
        Sanctum::actingAs($guest);
        $this->send($property)->assertCreated();

        $conversation = Conversation::firstOrFail();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/v1/conversations/{$conversation->id}")->assertForbidden();
    }

    public function test_both_sides_can_read_and_reply(): void
    {
        [$owner, $property] = $this->publishedListing();

        $guest = User::factory()->create();
        Sanctum::actingAs($guest);
        $this->send($property)->assertCreated();

        $conversation = Conversation::firstOrFail();

        // The owner reads it and answers.
        Sanctum::actingAs($owner);
        $this->getJson("/api/v1/conversations/{$conversation->id}")->assertOk();
        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'Oui, encore disponible.',
        ])->assertCreated();

        // The guest sees both messages.
        Sanctum::actingAs($guest);
        $this->getJson("/api/v1/conversations/{$conversation->id}")
            ->assertOk()
            ->assertJsonCount(2, 'messages');
    }

    public function test_unread_is_counted_from_the_viewers_point_of_view(): void
    {
        [$owner, $property] = $this->publishedListing();

        $guest = User::factory()->create();
        Sanctum::actingAs($guest);
        $this->send($property)->assertCreated();

        // The sender has nothing unread — their own message is not news
        // to them.
        $this->getJson('/api/v1/conversations/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        // The owner does.
        Sanctum::actingAs($owner);
        $this->getJson('/api/v1/conversations/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_count', 1);
    }

    public function test_marking_read_only_touches_the_other_sides_messages(): void
    {
        [$owner, $property] = $this->publishedListing();

        $guest = User::factory()->create();
        Sanctum::actingAs($guest);
        $this->send($property)->assertCreated();

        $conversation = Conversation::firstOrFail();

        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'body' => 'Reponse du proprietaire.',
        ])->assertCreated();

        // The owner marks the thread read: the guest's message becomes
        // read, the owner's own reply stays unread (it is waiting for
        // the guest).
        $this->patchJson("/api/v1/conversations/{$conversation->id}/read")
            ->assertOk()
            ->assertJsonPath('marked', 1);

        $this->getJson('/api/v1/conversations/unread-count')->assertJsonPath('unread_count', 0);

        Sanctum::actingAs($guest);
        $this->getJson('/api/v1/conversations/unread-count')->assertJsonPath('unread_count', 1);
    }

    public function test_a_burst_of_messages_rings_the_bell_only_once(): void
    {
        // Someone typing three short lines in a row is normal. Three
        // notifications for one conversation is not.
        Notification::fake();

        [$owner, $property] = $this->publishedListing();
        Sanctum::actingAs(User::factory()->create());

        $this->send($property, 'Bonjour')->assertCreated();
        $this->send($property, 'Est-ce disponible ?')->assertCreated();
        $this->send($property, 'Merci')->assertCreated();

        Notification::assertSentToTimes($owner, NewMessageNotification::class, 1);
    }

    public function test_the_bell_rings_again_once_the_thread_has_been_read(): void
    {
        Notification::fake();

        [$owner, $property] = $this->publishedListing();
        $guest = User::factory()->create();

        Sanctum::actingAs($guest);
        $this->send($property, 'Bonjour')->assertCreated();

        $conversation = Conversation::firstOrFail();

        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/conversations/{$conversation->id}/read")->assertOk();

        // Nothing is unread any more, so the next message is news again.
        Sanctum::actingAs($guest);
        $this->send($property, 'Une derniere question')->assertCreated();

        Notification::assertSentToTimes($owner, NewMessageNotification::class, 2);
    }

    public function test_an_empty_message_is_refused(): void
    {
        [, $property] = $this->publishedListing();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/conversations', [
            'property_id' => $property->id,
            'body' => '',
        ])->assertStatus(422);
    }

    public function test_the_inbox_shows_threads_from_both_sides(): void
    {
        // A user is the interested party on one listing and the owner on
        // another. Both threads belong in the same inbox.
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $bobsListing = Property::factory()->shortTerm()->for($bob, 'owner')->create();
        $alicesListing = Property::factory()->shortTerm()->for($alice, 'owner')->create();

        Sanctum::actingAs($alice);
        $this->send($bobsListing)->assertCreated();

        Sanctum::actingAs($bob);
        $this->send($alicesListing)->assertCreated();

        Sanctum::actingAs($alice);
        $this->getJson('/api/v1/conversations')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
