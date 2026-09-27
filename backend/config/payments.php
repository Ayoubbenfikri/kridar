<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Is Kridar charging for anything at all?
    |--------------------------------------------------------------------------
    |
    | FALSE is the default, and that is the deliberate launch position
    | (Phase 28). Kridar goes live free while we learn what the Moroccan
    | market will actually pay for, and pricing is decided with real usage
    | data instead of a guess.
    |
    | Nothing was deleted to make that happen. With this off:
    |
    |   - PropertyService::publish() stops demanding the long-term
    |     publication fee (Property::isBlockedByPublicationFee()).
    |   - PricingService forces the short-term commission to 0, so a
    |     booking snapshots 0 rather than a 10% cut nobody collects.
    |   - PaymentService refuses to start any payment at all.
    |   - PropertyResource reports requires_publication_fee = false, which
    |     is what makes the owner's "pay the fee" button disappear without
    |     a single frontend condition.
    |   - GET /settings publishes this flag, so the frontend can say
    |     "free" instead of guessing.
    |
    | Turning it back on is this one line. Every table, column, service,
    | admin setting and the whole PayPal integration are still here and
    | still tested — see tests/Feature/Pricing (paid model) and
    | FreeModeTest (this one).
    |
    | The suite runs with it ON (phpunit.xml), so the paid model stays
    | covered while it is dormant.
    |
    */
    'enabled' => env('PAYMENTS_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Active payment gateway
    |--------------------------------------------------------------------------
    |
    | Which implementation of App\Services\Gateways\PaymentGatewayInterface
    | is bound in RepositoryServiceProvider:
    |
    |   'fake'   FakeCmiGateway  - no network, always succeeds. This is what
    |                              the test-*.ps1 scripts expect, so keep it
    |                              as the default and switch to paypal in
    |                              .env only while testing the real flow.
    |   'paypal' PaypalGateway   - real PayPal Orders v2 calls (sandbox).
    |
    | Irrelevant while 'enabled' is false — nothing reaches a gateway.
    |
    */
    'gateway' => env('PAYMENT_GATEWAY', 'fake'),

    /*
    |--------------------------------------------------------------------------
    | Where the browser lands after a gateway redirect
    |--------------------------------------------------------------------------
    |
    | PayPal sends the BUYER's browser back to us, not a server-to-server
    | webhook. We capture the payment and then bounce the browser to the
    | React app - which lives on a different port in dev.
    |
    */
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    'paypal' => [

        // Sandbox by default. The live host is https://api-m.paypal.com -
        // never hardcode it, so going live is an .env change only.
        'base_url' => env('PAYPAL_BASE_URL', 'https://api-m.sandbox.paypal.com'),

        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),

        /*
        | PayPal does NOT support MAD - its list of accepted currencies is
        | AUD BRL CAD CNY CZK DKK EUR HKD HUF ILS JPY MYR MXN TWD NZD NOK
        | PHP PLN GBP SGD SEK CHF THB USD, and the dirham is not in it.
        |
        | So every amount is converted right before the PayPal call, using
        | the admin-configurable rate in SettingService. Kridar's own books
        | stay in MAD: payments.amount is still the MAD figure, and the
        | converted figure is stored beside it in converted_amount.
        */
        'currency' => env('PAYPAL_CURRENCY', 'EUR'),

        // Seconds before a PayPal HTTP call gives up. Short on purpose:
        // an owner staring at a spinner is worse than a clear error.
        'timeout' => (int) env('PAYPAL_TIMEOUT', 20),
    ],

];
