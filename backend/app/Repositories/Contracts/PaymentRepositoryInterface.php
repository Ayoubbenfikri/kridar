<?php

namespace App\Repositories\Contracts;

use App\Models\Payment;
use Illuminate\Support\Collection;

interface PaymentRepositoryInterface
{
    public function create(array $attributes): Payment;

    public function update(Payment $payment, array $attributes): Payment;

    /**
     * The most recent payment attempt for a reservation, or null if none
     * exists yet.
     */
    public function latestForReservation(int $reservationId): ?Payment;

    /**
     * Every payment attempt for a reservation (retries included), newest
     * first — GET /reservations/{reservation}/payments.
     */
    public function listForReservation(int $reservationId): Collection;
}
