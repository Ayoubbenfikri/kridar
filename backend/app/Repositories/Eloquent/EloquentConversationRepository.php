<?php

namespace App\Repositories\Eloquent;

use App\Models\Conversation;
use App\Models\Message;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentConversationRepository implements ConversationRepositoryInterface
{
    /**
     * Columns the inbox and thread views need from the property. Loaded
     * explicitly rather than whole: a conversation list does not need a
     * description or a lat/lng.
     *
     * owner_id is NOT optional here — ConversationPolicy derives the
     * owner side from it, so omitting it would silently deny access.
     */
    private const PROPERTY_COLUMNS = 'property:id,owner_id,title,slug,city';

    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Conversation::query()
            ->where(function ($query) use ($userId) {
                $query->where('guest_id', $userId)
                    ->orWhereHas('property', fn ($property) => $property->where('owner_id', $userId));
            })
            ->with([self::PROPERTY_COLUMNS, 'property.owner:id,name', 'guest:id,name'])
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $userId),
            ])
            // A thread with no message yet would sort last on
            // last_message_at; created_at is the tiebreak. In practice
            // every thread is created WITH its first message.
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function findForPropertyAndGuest(int $propertyId, int $guestId): ?Conversation
    {
        return Conversation::query()
            ->where('property_id', $propertyId)
            ->where('guest_id', $guestId)
            ->with([self::PROPERTY_COLUMNS, 'property.owner:id,name', 'guest:id,name'])
            ->first();
    }

    public function create(array $attributes): Conversation
    {
        $conversation = Conversation::create($attributes);

        return $conversation->load([self::PROPERTY_COLUMNS, 'property.owner:id,name', 'guest:id,name']);
    }

    public function touchLastMessageAt(Conversation $conversation): Conversation
    {
        $conversation->update(['last_message_at' => now()]);

        return $conversation;
    }

    public function paginateMessages(Conversation $conversation, int $perPage = 30): LengthAwarePaginator
    {
        // Newest first so page 1 is the bottom of the thread — the part
        // anyone actually wants. The frontend reverses for display.
        return $conversation->messages()
            ->with('sender:id,name')
            ->latest()
            ->paginate($perPage);
    }

    public function addMessage(Conversation $conversation, int $senderId, string $body): Message
    {
        return $conversation->messages()->create([
            'sender_id' => $senderId,
            'body' => $body,
        ]);
    }

    public function unreadCountInConversation(Conversation $conversation, int $userId): int
    {
        return $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $userId)
            ->count();
    }

    public function totalUnreadForUser(int $userId): int
    {
        return Message::query()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $userId)
            ->whereHas('conversation', function ($conversation) use ($userId) {
                $conversation->where('guest_id', $userId)
                    ->orWhereHas('property', fn ($property) => $property->where('owner_id', $userId));
            })
            ->count();
    }

    public function markOtherSideAsRead(Conversation $conversation, int $userId): int
    {
        return $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $userId)
            ->update(['read_at' => now()]);
    }
}
