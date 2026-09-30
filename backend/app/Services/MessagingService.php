<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Enums\RoommateListingStatus;
use App\Exceptions\MessagingNotAllowedException;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Property;
use App\Models\RoommateListing;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Messaging between an interested person and the owner of a listing — a
 * property, or (since Phase R2) a roommate post.
 *
 * Every thread is scoped to a listing, which is what keeps this safe
 * without a moderation team: nobody can write to a stranger, only about
 * something that stranger chose to publish.
 */
class MessagingService
{
    public function __construct(
        private readonly ConversationRepositoryInterface $conversations,
        private readonly MessagingCreditsService $credits,
    ) {}

    public function listForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $this->conversations->paginateForUser($user->id, $perPage);
    }

    public function messages(Conversation $conversation, int $perPage = 30): LengthAwarePaginator
    {
        return $this->conversations->paginateMessages($conversation, $perPage);
    }

    public function unreadCount(User $user): int
    {
        return $this->conversations->totalUnreadForUser($user->id);
    }

    public function unreadCountIn(Conversation $conversation, User $user): int
    {
        return $this->conversations->unreadCountInConversation($conversation, $user->id);
    }

    /**
     * Open the thread about this property, or continue the existing one,
     * and post the first/next message.
     *
     * Who may call this is NOT a Policy question — there is no
     * conversation yet to authorize against. The rules live here:
     *
     *   - the listing must be published. A draft is not offered to
     *     anyone, so there is nothing to ask about; allowing it would
     *     also leak the existence of unpublished listings.
     *   - an owner cannot open a thread on their own listing. They have
     *     nobody to talk to until someone writes to them.
     *   - Phase 29 (monetization): starting a GENUINELY NEW conversation
     *     costs one free contact (or is covered by an active messaging
     *     pass) — continuing an existing one, and every reply, is always
     *     free. See MessagingCreditsService.
     */
    public function startOrContinue(Property $property, User $sender, string $body): Conversation
    {
        if ($property->status !== PropertyStatus::Published) {
            throw new MessagingNotAllowedException(
                'This listing is not published, so it cannot be contacted about.'
            );
        }

        if ($property->owner_id === $sender->id) {
            throw new MessagingNotAllowedException(
                'You cannot start a conversation about your own listing.'
            );
        }

        $conversation = DB::transaction(function () use ($property, $sender, $body): Conversation {
            $existing = $this->conversations->findForPropertyAndGuest($property->id, $sender->id);

            if ($existing !== null) {
                $this->conversations->addMessage($existing, $sender->id, $body);

                return $this->conversations->touchLastMessageAt($existing);
            }

            // Genuinely new: lock the sender's row and confirm they can
            // afford it BEFORE creating anything. checkAccess() throws
            // MessagingCreditsExhaustedException if neither a free
            // contact nor an active pass is available — nothing has been
            // written yet at that point.
            $accessPath = $this->credits->checkAccess($sender);

            $conversation = $this->conversations->create([
                'property_id' => $property->id,
                'guest_id' => $sender->id,
            ]);

            // Only spent AFTER the conversation row exists. If the create
            // above had thrown (e.g. the unique constraint losing a race
            // against a parallel request), the whole transaction — the
            // row lock included — rolls back and nothing is ever spent.
            if ($accessPath === MessagingCreditsService::FREE_CREDIT) {
                $this->credits->consumeFreeCredit($sender);
            }

            $this->conversations->addMessage($conversation, $sender->id, $body);

            return $this->conversations->touchLastMessageAt($conversation);
        });

        $this->notifyCounterpart($conversation, $sender);

        return $conversation;
    }

    /**
     * Same as startOrContinue() above, but for a roommate post instead
     * of a property.
     *
     * Deliberately a separate method rather than one generic method
     * taking Property|RoommateListing: the two have nothing in common
     * except "has an owner and a published state", and bending that into
     * a shared interface would cost more clarity — for the next person
     * reading this class — than the handful of duplicated lines save.
     * Same trade-off this codebase already makes elsewhere (property and
     * roommate listings are fully separate models, not a shared base
     * class).
     */
    public function startOrContinueRoommate(RoommateListing $listing, User $sender, string $body): Conversation
    {
        if ($listing->status !== RoommateListingStatus::Published) {
            throw new MessagingNotAllowedException(
                'This post is not published, so it cannot be contacted about.'
            );
        }

        if ($listing->user_id === $sender->id) {
            throw new MessagingNotAllowedException(
                'You cannot start a conversation about your own post.'
            );
        }

        $conversation = DB::transaction(function () use ($listing, $sender, $body): Conversation {
            $existing = $this->conversations->findForRoommateListingAndGuest($listing->id, $sender->id);

            if ($existing !== null) {
                $this->conversations->addMessage($existing, $sender->id, $body);

                return $this->conversations->touchLastMessageAt($existing);
            }

            $accessPath = $this->credits->checkAccess($sender);

            $conversation = $this->conversations->create([
                'roommate_listing_id' => $listing->id,
                'guest_id' => $sender->id,
            ]);

            if ($accessPath === MessagingCreditsService::FREE_CREDIT) {
                $this->credits->consumeFreeCredit($sender);
            }

            $this->conversations->addMessage($conversation, $sender->id, $body);

            return $this->conversations->touchLastMessageAt($conversation);
        });

        $this->notifyCounterpart($conversation, $sender);

        return $conversation;
    }

    /**
     * Reply in an existing thread. Membership is checked by
     * ConversationPolicy::reply() at the controller level, so by the
     * time we are here the sender is one of the two parties.
     */
    public function reply(Conversation $conversation, User $sender, string $body): Message
    {
        $message = DB::transaction(function () use ($conversation, $sender, $body): Message {
            $message = $this->conversations->addMessage($conversation, $sender->id, $body);
            $this->conversations->touchLastMessageAt($conversation);

            return $message;
        });

        $this->notifyCounterpart($conversation, $sender);

        return $message->load('sender:id,name');
    }

    public function markRead(Conversation $conversation, User $user): int
    {
        return $this->conversations->markOtherSideAsRead($conversation, $user->id);
    }

    /**
     * Ring the other person's bell — but only for the FIRST unread
     * message in a thread.
     *
     * Someone sending five short lines in a row is normal in a chat and
     * would otherwise produce five notifications for one conversation.
     * Once there is already something unread from this sender, the
     * recipient has been told; telling them again adds nothing.
     */
    private function notifyCounterpart(Conversation $conversation, User $sender): void
    {
        $recipient = $conversation->counterpartFor($sender->id);

        if ($recipient === null) {
            return;
        }

        $unreadFromSender = $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', $sender->id)
            ->count();

        if ($unreadFromSender === 1) {
            $recipient->notify(new NewMessageNotification($conversation, $sender));
        }
    }
}
