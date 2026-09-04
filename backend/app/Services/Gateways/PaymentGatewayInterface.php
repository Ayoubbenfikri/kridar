<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use Illuminate\Http\Request;

/**
 * Contract every payment provider must follow. PaymentService only ever
 * talks to this interface, never to a concrete gateway class — so
 * swapping FakeCmiGateway for a real CmiGateway later (once real CMI
 * merchant credentials exist) means writing ONE new class and changing
 * ONE binding in RepositoryServiceProvider. Nothing else in the app
 * changes.
 */
interface PaymentGatewayInterface
{
    /**
     * Start a payment. Returns whatever the guest's browser needs to
     * complete it — at minimum a URL to redirect them to.
     *
     * @return array{redirect_url: string}
     */
    public function initiate(Payment $payment): array;

    /**
     * Parse an incoming callback/webhook request from the gateway.
     *
     * @return array{provider_transaction_id: string, success: bool}
     */
    public function handleCallback(Request $request): array;
}
