<?php

namespace App\Services;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\PropertyStatus;
use App\Enums\PublicationStatus;
use App\Enums\ReservationStatus;
use App\Exceptions\PaymentNotAllowedException;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Services\Gateways\PaymentGatewayInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Kridar charges money in two unrelated situations, and BOTH go through
 * this one service and the same PaymentGatewayInterface:
 *
 *   initiate()                   — a guest pays for a booking
 *   initiateListingPublication() — an owner pays the one-off fee that
 *                                  lets a long-term listing go live
 *
 * handleCallback() is shared: the gateway doesn't know or care which
 * kind of payment it just confirmed, so the branching happens here,
 * after the payment row is marked paid.
 *
 * Nothing in this class knows whether the gateway is PayPal or the
 * offline fake — that is the whole point of the interface.
 */
class PaymentService
{
    public function __construct(
        private readonly PaymentRepositoryInterface $payments,
        private readonly PropertyRepositoryInterface $properties,
        private readonly PaymentGatewayInterface $gateway,
        private readonly SettingService $settings,
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
            'type' => PaymentType::Reservation,
            'reservation_id' => $reservation->id,
            'user_id' => $reservation->guest_id,
            'amount' => $reservation->total_price,
            'currency' => $reservation->property->currency ?? 'MAD',
            'provider' => $this->currentProvider(),
            'status' => PaymentStatus::Pending,
        ]);

        $gatewayData = $this->gateway->initiate($payment);
        $payment = $this->persistGatewayData($payment, $gatewayData);

        return [
            'payment' => $payment,
            'redirect_url' => $gatewayData['redirect_url'],
        ];
    }

    /**
     * The long-term listing publication fee.
     *
     * Who is allowed to call this (the owner, or an admin) is checked by
     * PropertyPolicy::update() at the controller level. This method only
     * decides whether there is anything to pay.
     *
     * The amount comes from SettingService, never from the request:
     * a fee sent by the frontend would be a fee the owner can choose.
     *
     * redirect_url is null in exactly one case — the admin set the fee
     * to 0 (a free-publication period). There is then nothing for a
     * gateway to do, so the payment is recorded as already settled and
     * the listing goes live immediately.
     *
     * @return array{payment: Payment, redirect_url: string|null}
     */
    public function initiateListingPublication(Property $property): array
    {
        if (! $property->requiresPublicationFee()) {
            throw new PaymentNotAllowedException(
                'This listing is short-term only — it has no publication fee to pay.'
            );
        }

        if ($property->publicationFeePaid()) {
            throw new PaymentNotAllowedException(
                'The publication fee for this listing has already been paid.'
            );
        }

        $fee = $this->settings->listingFee();
        $isFree = $fee <= 0;

        $payment = $this->payments->create([
            'type' => PaymentType::ListingPublication,
            'property_id' => $property->id,
            // The OWNER pays, not whoever clicked — an admin can trigger
            // this on an owner's behalf and the record must still say
            // whose listing was paid for.
            'user_id' => $property->owner_id,
            'amount' => $fee,
            'currency' => $property->currency ?? 'MAD',
            'provider' => $isFree ? PaymentProvider::Cash : $this->currentProvider(),
            'status' => $isFree ? PaymentStatus::Paid : PaymentStatus::Pending,
            'paid_at' => $isFree ? now() : null,
        ]);

        if ($isFree) {
            $this->markPublicationPaid($property);

            return ['payment' => $payment->fresh(), 'redirect_url' => null];
        }

        $this->properties->update($property, [
            'publication_status' => PublicationStatus::PendingPayment,
        ]);

        $gatewayData = $this->gateway->initiate($payment);
        $payment = $this->persistGatewayData($payment, $gatewayData);

        return [
            'payment' => $payment,
            'redirect_url' => $gatewayData['redirect_url'],
        ];
    }

    /**
     * Settle a payment the payer has come back from.
     *
     * Called from two places: the public GET return URL a gateway sends
     * the browser to, and the older POST callback the test scripts use.
     * Both end up here, and the bound gateway decides the outcome.
     */
    public function handleCallback(Payment $payment, Request $request): Payment
    {
        // Already settled — a refresh of the return URL, or PayPal and a
        // retry arriving at once. Capturing twice would be a real bug,
        // so stop here and report the payment as it stands.
        if ($payment->status === PaymentStatus::Paid) {
            return $payment;
        }

        $result = $this->gateway->handleCallback($payment, $request);

        if (! $result['success']) {
            // A failed publication payment deliberately leaves the
            // property on pending_payment, not "back to nothing": the
            // owner tried, and the owner screen should keep showing the
            // pay button rather than pretending nothing happened.
            return $this->payments->update($payment, [
                'status' => PaymentStatus::Failed,
                'provider_transaction_id' => $result['provider_transaction_id'],
            ]);
        }

        $payment = $this->payments->update($payment, [
            'status' => PaymentStatus::Paid,
            'provider_transaction_id' => $result['provider_transaction_id'],
            'paid_at' => now(),
        ]);

        if ($payment->isListingPublication() && $payment->property !== null) {
            $this->markPublicationPaid($payment->property);
        }

        return $payment;
    }

    /**
     * The payer backed out on the gateway's own page. Nothing was
     * charged; record the attempt as failed so the history is honest.
     */
    public function markCancelled(Payment $payment): Payment
    {
        if ($payment->status !== PaymentStatus::Pending) {
            return $payment;
        }

        return $this->payments->update($payment, ['status' => PaymentStatus::Failed]);
    }

    public function listForReservation(Reservation $reservation): Collection
    {
        return $this->payments->listForReservation($reservation->id);
    }

    /**
     * Store whatever extra the gateway handed back. A simple gateway
     * returns only redirect_url and nothing is written.
     *
     * @param  array<string, mixed>  $gatewayData
     */
    private function persistGatewayData(Payment $payment, array $gatewayData): Payment
    {
        $attributes = array_filter([
            'provider_order_id' => $gatewayData['provider_order_id'] ?? null,
            'converted_amount' => $gatewayData['converted_amount'] ?? null,
            'converted_currency' => $gatewayData['converted_currency'] ?? null,
        ], fn ($value) => $value !== null);

        if ($attributes === []) {
            return $payment;
        }

        return $this->payments->update($payment, $attributes);
    }

    /**
     * Which provider to record on a new payment. Derived from the bound
     * gateway rather than hardcoded, so the payment history says what
     * actually processed it.
     */
    private function currentProvider(): PaymentProvider
    {
        return config('payments.gateway') === 'paypal'
            ? PaymentProvider::Paypal
            : PaymentProvider::Cmi;
    }

    /**
     * The fee is settled: record it, and take the listing live.
     *
     * Publishing here is deliberate — paying IS the owner's "publish"
     * action for a long-term listing, so making them click again
     * afterwards would just be a second step for nothing.
     *
     * The one exception is a suspended listing: only an admin lifts a
     * suspension (see PropertyService::publish()), so paying records the
     * fee but does not quietly undo the suspension.
     */
    private function markPublicationPaid(Property $property): void
    {
        $attributes = [
            'publication_status' => PublicationStatus::Paid,
            'publication_paid_at' => now(),
        ];

        if ($property->status !== PropertyStatus::Suspended) {
            $attributes['status'] = PropertyStatus::Published;
            $attributes['published_at'] = now();
        }

        $this->properties->update($property, $attributes);
    }
}
