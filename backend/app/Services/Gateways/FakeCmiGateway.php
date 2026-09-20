<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * A gateway that never touches the network: it always succeeds, in one
 * hop. It exists so the test-*.ps1 scripts and local development do not
 * depend on PayPal being reachable, on sandbox credentials, or on a
 * human clicking through a checkout page.
 *
 * Select it with PAYMENT_GATEWAY=fake (the default) — see
 * config/payments.php.
 *
 * initiate() hands back a URL to OUR OWN return endpoint instead of a
 * hosted payment page, so the redirect-then-return shape is IDENTICAL
 * to PayPal's. That is the point: the frontend does the same thing
 * whichever gateway is bound.
 *
 * It verifies nothing, which is fine for local testing and would be a
 * security hole in production. It is not meant to ever be bound there.
 */
class FakeCmiGateway implements PaymentGatewayInterface
{
    public function initiate(Payment $payment): array
    {
        return [
            'redirect_url' => url("/api/v1/payments/{$payment->id}/return"),
        ];
    }

    public function handleCallback(Payment $payment, Request $request): array
    {
        return [
            'provider_transaction_id' => $request->string('provider_transaction_id')->toString()
                ?: ('FAKE-'.Str::upper(Str::random(12))),
            // Defaults to true so a plain GET to the return URL just
            // works; pass ?success=0 to exercise the failure path.
            'success' => $request->boolean('success', true),
        ];
    }
}
