<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Stands in for the real CMI gateway until real merchant credentials and
 * API docs are available. initiate() hands back a URL to OUR OWN
 * callback endpoint instead of CMI's hosted payment page — hitting it
 * (with a success=true|false flag) is what a test script does in place
 * of "guest pays on CMI's page, then CMI notifies us".
 *
 * TODO (when real CMI access exists): write CmiGateway implementing the
 * same interface — build the real hosted-payment redirect in initiate(),
 * and in handleCallback() VERIFY CMI's signature on the incoming request
 * before trusting anything in it. This fake version does NOT verify
 * anything, which is fine for local testing but would be a security hole
 * in production.
 */
class FakeCmiGateway implements PaymentGatewayInterface
{
    public function initiate(Payment $payment): array
    {
        return [
            'redirect_url' => url("/api/v1/payments/{$payment->id}/callback"),
        ];
    }

    public function handleCallback(Request $request): array
    {
        return [
            'provider_transaction_id' => $request->string('provider_transaction_id')->toString()
                ?: ('FAKE-'.Str::upper(Str::random(12))),
            'success' => $request->boolean('success', true),
        ];
    }
}
