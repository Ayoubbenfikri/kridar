<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    /**
     * The person who paid, the owner of the property being paid for, or
     * an admin.
     *
     * Phase 22 (pricing) note: a listing-publication payment has NO
     * reservation, so the old `$payment->reservation->property` chain
     * would blow up on null. Those payments are made BY the owner, so
     * the first check already covers them — anyone else (other than an
     * admin) has no business seeing them.
     */
    public function view(User $user, Payment $payment): bool
    {
        if ($user->id === $payment->user_id || $user->isAdmin()) {
            return true;
        }

        if ($payment->reservation === null) {
            return false;
        }

        return $user->id === $payment->reservation->property->owner_id;
    }
}
