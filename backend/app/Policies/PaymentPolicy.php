<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    /**
     * The guest who made the payment, the owner of the property being
     * paid for, or an admin — same circle as ReservationPolicy::view().
     */
    public function view(User $user, Payment $payment): bool
    {
        return $user->id === $payment->user_id
            || $user->id === $payment->reservation->property->owner_id
            || $user->isAdmin();
    }
}
