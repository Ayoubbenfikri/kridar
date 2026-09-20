<?php

namespace App\Services\Gateways;

use App\Exceptions\PaymentGatewayException;
use App\Models\Payment;
use App\Services\SettingService;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PayPal Orders v2, called directly over HTTP — three endpoints, no SDK:
 *
 *   POST /v1/oauth2/token                     Basic auth -> access_token
 *   POST /v2/checkout/orders                  -> order id + approval link
 *   POST /v2/checkout/orders/{id}/capture     -> the money moves
 *
 * The flow, end to end:
 *   1. initiate() creates the order and returns PayPal's "payer-action"
 *      link.
 *   2. The browser goes to PayPal and the buyer approves there.
 *   3. PayPal sends the BROWSER back to our return_url with
 *      ?token=<order id> — a GET, not a server-to-server webhook.
 *   4. handleCallback() captures the order. Until it does, the money
 *      has NOT moved; approval alone settles nothing.
 *
 * THE CURRENCY PROBLEM: PayPal does not accept MAD. Every amount is
 * divided by the admin's MAD-per-unit rate right before the call.
 * Kridar's books stay in MAD — see config/payments.php.
 *
 * LIMIT worth knowing before production: if the buyer approves and then
 * closes the tab before the return_url loads, step 4 never runs and the
 * order stays approved-but-uncaptured. Fixing that properly means
 * subscribing to PayPal webhooks (and verifying their signature) or a
 * scheduled job that re-checks pending orders. Out of scope for the
 * sandbox integration; do not ship to production without one of them.
 */
class PaypalGateway implements PaymentGatewayInterface
{
    /**
     * PayPal says its tokens last about 8 hours. Caching for 30 minutes
     * is deliberately conservative: it removes a round trip from nearly
     * every call while never being the reason a token is stale.
     */
    private const TOKEN_CACHE_KEY = 'kridar.paypal.access_token';

    private const TOKEN_CACHE_MINUTES = 30;

    public function __construct(
        private readonly SettingService $settings,
    ) {}

    public function initiate(Payment $payment): array
    {
        $currency = (string) config('payments.paypal.currency');
        $amount = $this->convertFromMad((float) $payment->amount);

        $response = $this->client()
            ->withToken($this->accessToken())
            ->post($this->url('/v2/checkout/orders'), [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    // Shows up in the PayPal dashboard — makes a sandbox
                    // transaction traceable back to a Kridar row.
                    'reference_id' => "kridar-payment-{$payment->id}",
                    'amount' => [
                        'currency_code' => $currency,
                        // PayPal wants a string with exactly 2 decimals.
                        'value' => number_format($amount, 2, '.', ''),
                    ],
                ]],
                'payment_source' => [
                    'paypal' => [
                        'experience_context' => [
                            'return_url' => url("/api/v1/payments/{$payment->id}/return"),
                            'cancel_url' => url("/api/v1/payments/{$payment->id}/cancel"),
                            // "Pay Now" instead of "Continue" — there is
                            // no review step on our side afterwards.
                            'user_action' => 'PAY_NOW',
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            $this->logFailure('create order', $payment, $response->status(), $response->body());

            throw new PaymentGatewayException(
                'PayPal refused to open the payment. Please try again in a moment.'
            );
        }

        $body = $response->json();

        // v2 names the buyer-approval link "payer-action" (v1 called it
        // "approve"). Read it out rather than assuming a position.
        $link = collect($body['links'] ?? [])->firstWhere('rel', 'payer-action');
        $approvalUrl = $link['href'] ?? null;
        $orderId = $body['id'] ?? null;

        if ($approvalUrl === null || $orderId === null) {
            $this->logFailure('create order', $payment, $response->status(), $response->body());

            throw new PaymentGatewayException('PayPal did not return a usable payment link.');
        }

        return [
            'redirect_url' => $approvalUrl,
            'provider_order_id' => $orderId,
            'converted_amount' => $amount,
            'converted_currency' => $currency,
        ];
    }

    public function handleCallback(Payment $payment, Request $request): array
    {
        $orderId = $payment->provider_order_id;

        if ($orderId === null) {
            Log::warning('PayPal callback on a payment with no order id.', [
                'payment_id' => $payment->id,
            ]);

            return ['provider_transaction_id' => '', 'success' => false];
        }

        // PayPal ALWAYS returns the order id as ?token= on the return
        // URL, so requiring an exact match is safe — and necessary.
        //
        // An earlier version allowed an empty token through ("only
        // refuse if it is present AND different"). That was a hole: any
        // request reaching this method with no token at all — including
        // the legacy POST /callback route the frontend still used — went
        // straight to capturing an order the buyer had never approved.
        // PayPal rejected it, the payment was marked failed, and the UI
        // reported success anyway. Approval must come first, and only
        // the matching token proves it is this order coming back.
        if ($request->string('token')->toString() !== $orderId) {
            Log::warning('PayPal return token missing or does not match the stored order id.', [
                'payment_id' => $payment->id,
            ]);

            return ['provider_transaction_id' => $orderId, 'success' => false];
        }

        // The capture endpoint takes an empty JSON body, not no body.
        $response = $this->client()
            ->withToken($this->accessToken())
            ->withBody('{}', 'application/json')
            ->post($this->url("/v2/checkout/orders/{$orderId}/capture"));

        if ($response->failed()) {
            $this->logFailure('capture order', $payment, $response->status(), $response->body());

            return ['provider_transaction_id' => $orderId, 'success' => false];
        }

        $body = $response->json();

        // The capture id is what a refund would later reference, so it
        // is the id worth keeping. Fall back to the order id if the
        // shape ever surprises us — better a traceable id than none.
        $captureId = $body['purchase_units'][0]['payments']['captures'][0]['id'] ?? $orderId;

        return [
            'provider_transaction_id' => $captureId,
            'success' => ($body['status'] ?? null) === 'COMPLETED',
        ];
    }

    /**
     * MAD -> PayPal currency. The rate is "how many MAD for one unit of
     * the PayPal currency" (e.g. 10.80 MAD per EUR), because that is how
     * the rate is quoted in Morocco — so the admin types the number they
     * already know.
     */
    private function convertFromMad(float $amountInMad): float
    {
        $rate = $this->settings->paypalRate();

        if ($rate <= 0) {
            throw new PaymentGatewayException(
                'The MAD conversion rate is not configured. An administrator must set it before payments can run.'
            );
        }

        $converted = round($amountInMad / $rate, 2);

        // PayPal rejects a zero amount, and a fee that rounds to nothing
        // means the rate is wrong — say so instead of failing at PayPal.
        if ($converted < 0.01) {
            throw new PaymentGatewayException(
                'This amount converts to less than one cent. Check the conversion rate in the admin settings.'
            );
        }

        return $converted;
    }

    private function accessToken(): string
    {
        $clientId = (string) config('payments.paypal.client_id');
        $clientSecret = (string) config('payments.paypal.client_secret');

        if ($clientId === '' || $clientSecret === '') {
            throw new PaymentGatewayException(
                'PayPal is selected as the payment gateway but its credentials are missing.'
            );
        }

        return Cache::remember(
            self::TOKEN_CACHE_KEY,
            now()->addMinutes(self::TOKEN_CACHE_MINUTES),
            function () use ($clientId, $clientSecret): string {
                $response = $this->client()
                    ->withBasicAuth($clientId, $clientSecret)
                    ->asForm()
                    ->post($this->url('/v1/oauth2/token'), ['grant_type' => 'client_credentials']);

                if ($response->failed()) {
                    // Never log the body here — it is the one response
                    // most likely to echo something credential-shaped.
                    Log::error('PayPal token request failed.', ['status' => $response->status()]);

                    throw new PaymentGatewayException(
                        'PayPal rejected the Kridar credentials. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.'
                    );
                }

                $token = $response->json('access_token');

                if (! is_string($token) || $token === '') {
                    throw new PaymentGatewayException('PayPal returned no access token.');
                }

                return $token;
            },
        );
    }

    private function client(): PendingRequest
    {
        return Http::acceptJson()->timeout((int) config('payments.paypal.timeout', 20));
    }

    private function url(string $path): string
    {
        return rtrim((string) config('payments.paypal.base_url'), '/').$path;
    }

    private function logFailure(string $step, Payment $payment, int $status, string $body): void
    {
        Log::error("PayPal {$step} failed.", [
            'payment_id' => $payment->id,
            'status' => $status,
            // Truncated: PayPal error bodies are long and we only need
            // enough to recognise which error it was.
            'body' => mb_substr($body, 0, 500),
        ]);
    }
}
