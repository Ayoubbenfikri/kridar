<?php

namespace App\Services;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Exceptions\PaymentNotAllowedException;
use App\Models\Payment;
use App\Models\Reservation;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Services\Gateways\PaymentGatewayInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class PaymentService
{
    public function __construct(
        private readonly PaymentRepositoryInterface $payments,
        private readonly PaymentGatewayInterface $gateway,
    ) {}

    /**
     * Start a payment for a reservation. Who is ALLOWED to call this
     * (must be the reservation's own guest) is checked by
     * ReservationPolicy::initiatePayment() at the controller level — this
     * method only checks whether the reservation is in a payable STATE.
     *
     * @return array{payment: Payment, redirect_url: string}
     */
    public function initiate(Reservation $reservation): array
    {
        if ($reservation->status !== ReservationStatus::Confirmed) {
            throw new PaymentNotAllowedException(
                'This reservation must be confirmed by the owner before it can be paid.'
            );
        }

        $latest = $this->payments->latestForReservation($reservation->id);
        if ($latest !== null && $latest->status === PaymentStatus::Paid) {
            throw new PaymentNotAllowedException('This reservation has already been paid.');
        }

        $payment = $this->payments->create([
            'reservation_id' => $reservation->id,
            'user_id' => $reservation->guest_id,
            'amount' => $reservation->total_price,
            'currency' => $reservation->property->currency ?? 'MAD',
            'provider' => PaymentProvider::Cmi,
            'status' => PaymentStatus::Pending,
        ]);

        $gatewayData = $this->gateway->initiate($payment);

        return [
            'payment' => $payment,
            'redirect_url' => $gatewayData['redirect_url'],
        ];
    }

    /**
     * Handle the gateway's callback/webhook for a specific payment
     * attempt and update its status accordingly.
     */
    public function handleCallback(Payment $payment, Request $request): Payment
    {
        $result = $this->gateway->handleCallback($request);

        if ($result['success']) {
            return $this->payments->update($payment, [
                'status' => PaymentStatus::Paid,
                'provider_transaction_id' => $result['provider_transaction_id'],
                'paid_at' => now(),
            ]);
        }

        return $this->payments->update($payment, [
            'status' => PaymentStatus::Failed,
            'provider_transaction_id' => $result['provider_transaction_id'],
        ]);
    }

    public function listForReservation(Reservation $reservation): Collection
    {
        return $this->payments->listForReservation($reservation->id);
    }
}
