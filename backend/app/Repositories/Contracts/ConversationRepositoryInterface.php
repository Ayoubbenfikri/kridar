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
     * The one thread between this person and this property, or null.
     * There can only ever be one — unique(property_id, guest_id).
     */
    public function findForPropertyAndGuest(int $propertyId, int $guestId): ?Conversation;

    /**
     * Same as above, for a roommate post — unique(roommate_listing_id, guest_id).
     */
    public function findForRoommateListingAndGuest(int $roommateListingId, int $guestId): ?Conversation;

    public function create(array $attributes): Conversation;

    public function touchLastMessageAt(Conversation $conversation): Conversation;

    public function paginateMessages(Conversation $conversation, int $perPage = 30): LengthAwarePaginator;

    /**
     * $sharedPropertyId/$sharedRoommateListingId are the optional
     * "Partager une annonce" attachment — at most one non-null, already
     * validated (ownership + published) by the caller
     * (MessagingService::resolveSharedListing()) before this is called.
     */
    public function addMessage(
        Conversation $conversation,
        int $senderId,
        string $body,
        ?int $sharedPropertyId = null,
        ?int $sharedRoommateListingId = null,
    ): Message;

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

    /**
     * Edit your own message's text. Ownership + "not already deleted"
     * already checked by MessagePolicy::update() before this is called.
     */
    public function updateMessage(Message $message, string $body): Message;

    /**
     * Soft delete: stamps deleted_at, keeps the row (and its real body)
     * in the database — see the migration that added this column for
     * why this is a plain column rather than Eloquent's SoftDeletes.
     */
    public function deleteMessage(Message $message): Message;
}
