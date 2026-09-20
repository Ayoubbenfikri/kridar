<?php

namespace App\Repositories\Contracts;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Pagination\LengthAwarePaginator;

interface ConversationRepositoryInterface
{
    /**
     * Every thread this user is in, on EITHER side (they may be the
     * interested party on one listing and the owner on another), most
     * recent activity first.
     *
     * Carries an `unread_count` per row, computed from this user's
     * point of view — "unread" has no meaning without a viewer.
     */
    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    /**
     * The one thread between this person and this listing, or null.
     * There can only ever be one — unique(property_id, guest_id).
     */
    public function findForPropertyAndGuest(int $propertyId, int $guestId): ?Conversation;

    public function create(array $attributes): Conversation;

    public function touchLastMessageAt(Conversation $conversation): Conversation;

    public function paginateMessages(Conversation $conversation, int $perPage = 30): LengthAwarePaginator;

    public function addMessage(Conversation $conversation, int $senderId, string $body): Message;

    /**
     * How many messages in this thread are waiting for $userId — i.e.
     * sent by the other side and never read.
     */
    public function unreadCountInConversation(Conversation $conversation, int $userId): int;

    /** Across every thread, for the navbar badge. */
    public function totalUnreadForUser(int $userId): int;

    /**
     * @return int how many were marked
     */
    public function markOtherSideAsRead(Conversation $conversation, int $userId): int;
}
