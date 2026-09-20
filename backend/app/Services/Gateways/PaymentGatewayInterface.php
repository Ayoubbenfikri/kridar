<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use Illuminate\Http\Request;

/**
 * Contract every payment provider must follow. PaymentService only ever
 * talks to this interface, never to a concrete gateway class — so
 * swapping FakeCmiGateway for PaypalGateway means changing ONE binding
 * in RepositoryServiceProvider (driven by config('payments.gateway')).
 * Nothing else in the app changes.
 */
interface PaymentGatewayInterface
{
    /**
     * Start a payment. Returns whatever the payer's browser needs to
     * complete it — at minimum a URL to send them to.
     *
     * The optional keys exist for providers that do more than hand back
     * a link. PaymentService persists whichever ones are present, so a
     * simple gateway can keep returning just redirect_url:
     *
     *   provider_order_id   an id created BEFORE the payer approves
     *                       (PayPal's order id), needed later to capture
     *   converted_amount    the amount actually charged, when the
     *   converted_currency  provider cannot accept MAD
     *
     * @return array{
     *     redirect_url: string,
     *     provider_order_id?: string,
     *     converted_amount?: float,
     *     converted_currency?: string
     * }
     */
    public function initiate(Payment $payment): array;

    /**
     * Decide the outcome of a payment the payer has come back from.
     *
     * The Payment is passed in (it was not, before PayPal) because a
     * real provider needs to know WHICH of its own orders to settle —
     * that id lives on the payment row, not in the incoming request,
     * and taking it from the request instead would let anyone name
     * someone else's order.
     *
     * @return array{provider_transaction_id: string, success: bool}
     */
    public function handleCallback(Payment $payment, Request $request): array;
}
