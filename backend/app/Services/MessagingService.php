<?php

namespace App\Services;

use App\Enums\PropertyStatus;
use App\Exceptions\MessagingNotAllowedException;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Property;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Messaging between an interested person and a property owner.
 *
 * Every thread is scoped to a listing, which is what keeps this safe
 * without a moderation team: nobody can write to a stranger, only about
 * something that stranger chose to publish.
 */
class MessagingService
{
    public function __construct(
        private readonly ConversationRepositoryInterface $conversations,
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
     * Open the thread about this listing, or continue the existing one,
     * and post the first/next message.
     *
     * Who may call this is NOT a Policy question — there is no
     * conversation yet to authorize against. The two rules live here:
     *
     *   - the listing must be published. A draft is not offered to
     *     anyone, so there is nothing to ask about; allowing it would
     *     also leak the existence of unpublished listings.
     *   - an owner cannot open a thread on their own listing. They have
     *     nobody to talk to until someone writes to them.
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
            $conversation = $this->conversations->findForPropertyAndGuest($property->id, $sender->id)
                ?? $this->conversations->create([
                    'property_id' => $property->id,
                    'guest_id' => $sender->id,
                ]);

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
