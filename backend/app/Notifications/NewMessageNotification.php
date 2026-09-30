<?php

namespace App\Notifications;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Notifications\Notification;

/**
 * Sent to the other party when a thread receives its first unread
 * message (see MessagingService::notifyCounterpart — a burst of replies
 * rings the bell once, not once per line).
 *
 * In-app only (database channel), like every other notification here.
 * The shape matches the rest: a ready-to-render `message`, plus the ids
 * the frontend needs to link somewhere useful.
 *
 * Since Phase R2 a thread can be about a property OR a roommate post.
 * `property_title` is kept as the payload key name on purpose, even for
 * a roommate thread — the frontend notification dropdown reads that key
 * today and this file cannot see whether it was updated yet, so
 * renaming it would risk silently breaking it for every property
 * notification too. `roommate_listing_id` is new/additive only.
 */
class NewMessageNotification extends Notification
{
    public function __construct(
        private readonly Conversation $conversation,
        private readonly User $sender,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $listingTitle = $this->conversation->property?->title
            ?? $this->conversation->roommateListing?->title
            ?? 'une annonce';

        return [
            'type' => 'new_message',
            'conversation_id' => $this->conversation->id,
            'property_id' => $this->conversation->property_id,
            'roommate_listing_id' => $this->conversation->roommate_listing_id,
            'property_title' => $listingTitle,
            'sender_name' => $this->sender->name,
            'message' => "{$this->sender->name} vous a envoyé un message à propos de \"{$listingTitle}\".",
        ];
    }
}
