<?php

namespace App\Services;

use App\Exceptions\MessagingCreditsExhaustedException;
use App\Models\User;

/**
 * Guards the one thing the monetization spec cares about most: a NEW
 * conversation must consume exactly one free contact (or be covered by an
 * active pass), even under a double-click or two parallel requests for
 * different listings at once.
 *
 * Usage, always from inside MessagingService::startOrContinue()'s
 * existing DB::transaction() (see that method):
 *
 *   $accessPath = $this->credits->checkAccess($sender); // may throw
 *   $conversation = ... create the conversation row ...
 *   if ($accessPath === self::FREE_CREDIT) {
 *       $this->credits->consumeFreeCredit($sender);
 *   }
 *
 * checkAccess() never writes anything — it only locks the user row (so no
 * other request can read a stale credit count while this one is deciding)
 * and reports which path applies. consumeFreeCredit() is called
 * separately, and only AFTER the conversation has actually been created,
 * so a failure in between (e.g. the unique constraint losing a race)
 * rolls the whole transaction back — including the row lock — without
 * ever having spent the user's credit.
 */
class MessagingCreditsService
{
    public const FREE_CREDIT = 'free_credit';

    public const ACTIVE_PASS = 'active_pass';

    /**
     * Nothing is actually spent for this path — see checkAccess() below.
     * It exists so the caller's "only consume on FREE_CREDIT" check keeps
     * working without a third branch.
     */
    public const UNLIMITED = 'unlimited';

    /**
     * @return self::FREE_CREDIT|self::ACTIVE_PASS|self::UNLIMITED
     *
     * @throws MessagingCreditsExhaustedException
     */
    public function checkAccess(User $user): string
    {
        // Same treatment as every other paywall in the app (the
        // publication fee, phone reveal): while Kridar is free, this
        // limit does not exist at all. This also keeps the system usable
        // — initiateMessagingPack() refuses to sell a pack while payments
        // are disabled, so a user who ran out of free contacts here with
        // no way to pay would be locked out of messaging for good.
        if (! config('payments.enabled')) {
            return self::UNLIMITED;
        }

        // lockForUpdate only actually holds the lock until COMMIT when
        // called inside an open transaction — see the class docblock.
        // Called outside one, it would still run but release immediately,
        // which is exactly the race this class exists to prevent.
        $locked = User::query()->lockForUpdate()->findOrFail($user->id);

        if ($this->hasActivePass($locked)) {
            return self::ACTIVE_PASS;
        }

        if ($locked->free_contacts_remaining > 0) {
            return self::FREE_CREDIT;
        }

        throw new MessagingCreditsExhaustedException(
            'You have used all your free contacts. Buy a messaging pass to keep starting new conversations.'
        );
    }

    /**
     * Spends one free contact. Call this ONLY after the new conversation
     * row has actually been created — never before, and never for a
     * conversation that already existed (replying is always free).
     */
    public function consumeFreeCredit(User $user): void
    {
        User::query()->where('id', $user->id)->decrement('free_contacts_remaining');
    }

    private function hasActivePass(User $user): bool
    {
        return $user->messagingPasses()
            ->where('expires_at', '>', now())
            ->exists();
    }
}
