<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

/**
 * Two people are in a thread and nobody else. Same shape as
 * ReservationPolicy: membership is checked against the row, not against
 * a role.
 */
class ConversationPolicy
{
    /**
     * Read the thread. The owner side is derived from the property, so
     * this needs `property` loaded — every query that reaches here does
     * load it (see EloquentConversationRepository).
     */
    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->involves($user->id) || $user->isAdmin();
    }

    /**
     * Post a reply.
     *
     * Deliberately NOT granted to admins: an admin reading a thread for
     * moderation is one thing, an admin writing into it while appearing
     * to be one of the two parties is another. Nobody in the UI could
     * tell the difference.
     */
    public function reply(User $user, Conversation $conversation): bool
    {
        return $conversation->involves($user->id);
    }
}
