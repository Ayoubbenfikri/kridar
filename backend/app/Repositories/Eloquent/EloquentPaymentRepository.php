<?php

namespace App\Repositories\Eloquent;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentPaymentRepository implements PaymentRepositoryInterface
{
    public function create(array $attributes): Payment
    {
        return Payment::create($attributes);
    }

    public function update(Payment $payment, array $attributes): Payment
    {
        $payment->update($attributes);

        return $payment->fresh();
    }

    public function latestForReservation(int $reservationId): ?Payment
    {
        return Payment::query()
            ->where('reservation_id', $reservationId)
            ->latest()
            ->first();
    }

    public function listForReservation(int $reservationId): Collection
    {
        return Payment::query()
            ->where('reservation_id', $reservationId)
            ->latest()
            ->get();
    }
}
