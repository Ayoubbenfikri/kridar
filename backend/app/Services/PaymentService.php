<?php

namespace App\Services;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\PropertyStatus;
use App\Enums\PublicationStatus;
use App\Enums\ReservationStatus;
use App\Exceptions\PaymentNotAllowedException;
use App\Models\MessagingPass;
use App\Models\Payment;
use App\Models\PhoneReveal;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
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
     * Refuse to start any payment while Kridar is free (Phase 28).
     *
     * The frontend already hides every pay button in free mode, which is
     * exactly why this exists: a hidden button is not a rule. A stale tab,
     * a bookmarked URL or curl can still POST to the payment endpoints,
     * and without this they would happily create a payment row — and for
     * a publication fee, publish the listing as a side effect.
     *
     * 409 rather than 404: the endpoint exists and will work again; it is
     * the current state of the platform that makes the request invalid.
     */
    private function ensurePaymentsAreEnabled(): void
    {
        if (! config('payments.enabled')) {
            throw new PaymentNotAllowedException(
                'Kridar is free at the moment — there is nothing to pay.'
            );
        }
    }

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
        $this->ensurePaymentsAreEnabled();

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
     * The fee for an ADDITIONAL listing (Phase 29 — the owner's first
     * one is always free, whatever its rental_type; see
     * PropertyService::create()).
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
        $this->ensurePaymentsAreEnabled();

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
     * Phase 29 — pay once to reveal one owner's phone number on one
     * listing. Completely independent of messaging credits: a user out
     * of free contacts can still reveal a number, and this never touches
     * free_contacts_remaining.
     *
     * @return array{payment: Payment, redirect_url: string}
     */
    public function initiatePhoneReveal(Property $property, User $user): array
    {
        $this->ensurePaymentsAreEnabled();

        // Loaded explicitly rather than trusted from the caller: this is
        // the one place that decides whether there is anything to reveal
        // at all, and it must not silently say "no" just because nobody
        // eager-loaded the owner columns before calling in.
        $property->loadMissing('owner:id,phone,show_phone_on_listings');

        if (! $property->listsOwnerPhone()) {
            throw new PaymentNotAllowedException(
                'This listing does not publish a phone number.'
            );
        }

        if ($property->owner_id === $user->id) {
            throw new PaymentNotAllowedException(
                'You cannot pay to reveal your own phone number.'
            );
        }

        if (PhoneReveal::query()->where('user_id', $user->id)->where('property_id', $property->id)->exists()) {
            throw new PaymentNotAllowedException(
                'You have already unlocked this phone number.'
            );
        }

        $fee = $this->settings->phoneRevealFee();

        $payment = $this->payments->create([
            'type' => PaymentType::PhoneReveal,
            'property_id' => $property->id,
            'user_id' => $user->id,
            'amount' => $fee,
            'currency' => $property->currency ?? 'MAD',
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
     * Phase 29 — a 7 or 15 day unlimited messaging pass, bought once the
     * 5 free contacts run out. See MessagingPass for why the row is
     * created here, upfront, rather than in handleCallback().
     *
     * @param  '7d'|'15d'  $duration
     * @return array{payment: Payment, redirect_url: string}
     */
    public function initiateMessagingPack(User $user, string $duration): array
    {
        $this->ensurePaymentsAreEnabled();

        $days = match ($duration) {
            '7d' => 7,
            '15d' => 15,
            default => throw new PaymentNotAllowedException('Unknown messaging pack duration.'),
        };

        $fee = $this->settings->messagingPackFee($duration);

        $payment = $this->payments->create([
            'type' => PaymentType::MessagingPack,
            'user_id' => $user->id,
            'amount' => $fee,
            'currency' => 'MAD',
            'provider' => $this->currentProvider(),
            'status' => PaymentStatus::Pending,
        ]);

        // duration_days is fixed now; starts_at/expires_at stay null until
        // handleCallback() confirms this payment actually went through.
        MessagingPass::create([
            'user_id' => $user->id,
            'payment_id' => $payment->id,
            'duration_days' => $days,
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

        // Security audit (Oct 2026): both writes below are CONDITIONAL
        // ("only if it is still not paid"), not a plain save of the model
        // loaded at the start of this request. Two returns for the same
        // payment can run at the same time (a double redirect, a refresh,
        // the POST callback). Before, the slower one could overwrite a
        // "paid" row with "failed" (PayPal refuses a second capture), and
        // two successful ones could both run the grants below.
        if (! $result['success']) {
            // A failed publication payment deliberately leaves the
            // property on pending_payment, not "back to nothing": the
            // owner tried, and the owner screen should keep showing the
            // pay button rather than pretending nothing happened.
            Payment::query()
                ->whereKey($payment->id)
                ->where('status', '!=', PaymentStatus::Paid->value)
                ->update([
                    'status' => PaymentStatus::Failed->value,
                    'provider_transaction_id' => $result['provider_transaction_id'],
                ]);

            return $payment->fresh();
        }

        $settledHere = Payment::query()
            ->whereKey($payment->id)
            ->where('status', '!=', PaymentStatus::Paid->value)
            ->update([
                'status' => PaymentStatus::Paid->value,
                'provider_transaction_id' => $result['provider_transaction_id'],
                'paid_at' => now(),
            ]);

        $payment = $payment->fresh();

        // Another request already settled it and ran the grants.
        if ($settledHere === 0) {
            return $payment;
        }

        if ($payment->isListingPublication() && $payment->property !== null) {
            $this->markPublicationPaid($payment->property);
        }

        if ($payment->isPhoneReveal() && $payment->property !== null) {
            $this->grantPhoneReveal($payment);
        }

        if ($payment->isMessagingPack()) {
            $this->grantMessagingPack($payment);
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

    /**
     * Phase 29 — the phone-reveal payment settled: record that this user
     * may now see this owner's number.
     *
     * firstOrCreate rather than create(): handleCallback() already
     * refuses to re-process an already-Paid payment (see the top of that
     * method), but this is the second, cheap lock — the unique
     * (user_id, property_id) constraint means a duplicate call can never
     * produce two rows even if this were somehow reached twice.
     */
    private function grantPhoneReveal(Payment $payment): void
    {
        PhoneReveal::firstOrCreate(
            ['user_id' => $payment->user_id, 'property_id' => $payment->property_id],
            ['payment_id' => $payment->id],
        );
    }

    /**
     * Phase 29 — the messaging-pack payment settled: start its clock. The
     * MessagingPass row already exists (created in initiateMessagingPack,
     * with duration_days but no dates yet) — this fills in starts_at/
     * expires_at exactly once. The `starts_at === null` guard is what
     * makes a second callback for the same payment a no-op instead of
     * pushing the expiry further out.
     */
    private function grantMessagingPack(Payment $payment): void
    {
        $pass = MessagingPass::query()->where('payment_id', $payment->id)->first();

        if ($pass !== null && $pass->starts_at === null) {
            $pass->update([
                'starts_at' => now(),
                'expires_at' => now()->addDays($pass->duration_days),
            ]);
        }
    }
}
