<?php

namespace App\Services\Gateways;

use App\Exceptions\PaymentGatewayException;
use App\Models\Payment;
use Illuminate\Http\Request;

/**
 * Bound instead of a real gateway when the configured one must NOT run
 * (security audit, Oct 2026 — see RepositoryServiceProvider):
 *
 *   - PAYMENT_GATEWAY names a gateway that does not exist (a typo), or
 *   - PAYMENT_GATEWAY=fake outside the local/testing environments.
 *
 * It never approves anything. Starting a payment answers 502 with a
 * message a user can read, and a returning payer is always treated as a
 * failed payment, so nobody can turn a pending payment into "paid".
 *
 * Kept as a gateway (rather than throwing from the container binding) on
 * purpose: PaymentService is built for EVERY payment endpoint, even while
 * PAYMENTS_ENABLED=false. Throwing at build time would turn the normal
 * "Krihouse is free" 409 answers into 500 errors.
 */
class UnavailableGateway implements PaymentGatewayInterface
{
    public function initiate(Payment $payment): array
    {
        throw new PaymentGatewayException(
            'Online payment is not available at the moment. Please try again later.'
        );
    }

    public function handleCallback(Payment $payment, Request $request): array
    {
        return [
            'provider_transaction_id' => '',
            'success' => false,
        ];
    }
}
