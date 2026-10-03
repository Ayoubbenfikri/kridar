<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

/**
 * Only the sender of a message may edit or delete it — never the other
 * party, never an admin (same "nobody impersonates one of the two
 * parties" reasoning as ConversationPolicy::reply()). Once a message is
 * already deleted (deleted_at set), both are refused: there is nothing
 * left to edit, and deleting an already-deleted message has no meaning.
 */
class MessagePolicy
{
    public function update(User $user, Message $message): bool
    {
        return $user->id === $message->sender_id && $message->deleted_at === null;
    }

    public function delete(User $user, Message $message): bool
    {
        return $user->id === $message->sender_id && $message->deleted_at === null;
    }
}
