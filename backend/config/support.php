<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Donations (Phase 28)
    |--------------------------------------------------------------------------
    |
    | Kridar launches free (see config/payments.php), so the only money
    | coming in is from people who choose to help. /support explains why
    | and how.
    |
    | Everything here is OPTIONAL. Each value that is left empty simply
    | does not render — the page shows whatever is filled in and nothing
    | else. That means you can ship /support today with only the bank
    | details, add a platform link next month, and never touch the code.
    |
    | Kept in config rather than in the settings table because these are
    | deployment facts, not business numbers an admin tunes from the
    | dashboard. They are also published by GET /settings, so changing a
    | value is a .env edit plus `php artisan config:clear` — no frontend
    | rebuild.
    |
    | ⚠️ Nothing secret belongs here. Every value is served to the public
    | API and rendered in the browser. A donation LINK and a bank account
    | number are both fine (they are meant to be given out); an API key or
    | a password is not.
    |
    */

    /*
    | PayPal.Me — just the USERNAME, not a URL.
    |
    |   DONATE_PAYPAL_ME=ayoubbenfikri     ->  paypal.me/ayoubbenfikri
    |
    | Given this, /support renders a row of preset amount buttons plus an
    | "other amount" link. PayPal.Me takes the amount in the path
    | (paypal.me/name/25EUR), so the presets are built as plain strings —
    | no API call, no credentials, nothing of yours in this codebase. The
    | payment happens entirely on paypal.com.
    |
    | Why the handle and not a full URL: the page builds several links from
    | it, and a handle cannot accidentally point somewhere else. It is
    | URL-encoded before use for the same reason.
    */
    'paypal_me' => env('DONATE_PAYPAL_ME'),

    /*
    | Which currency the preset amounts ask for.
    |
    | NOT MAD. PayPal does not support the dirham at all (see the currency
    | list in config/payments.php), and a PayPal.Me link carrying an
    | unsupported code silently falls back to the account's default — so
    | the button would request an amount nobody chose. EUR is the safe
    | default for a Moroccan account receiving from abroad.
    */
    'currency' => env('DONATE_CURRENCY', 'EUR'),

    // A one-click destination for any OTHER provider — Ko-fi, Buy Me a
    // Coffee, Patreon, GitHub Sponsors. Leave empty if PayPal above is the
    // only method; both can be set and both will render.
    //
    // Worth checking before committing to one: not every platform pays out
    // to a Moroccan bank account. That is a provider constraint, not a code
    // one, which is exactly why the manual methods below exist.
    'donate_url' => env('DONATE_URL'),

    // A plain bank transfer, for people who would rather not use a
    // platform. Shown as copyable text.
    'bank_label' => env('DONATE_BANK_LABEL'),
    'bank_details' => env('DONATE_BANK_DETAILS'),

    // A crypto address, for the same reason: it works regardless of which
    // countries a platform supports.
    'crypto_label' => env('DONATE_CRYPTO_LABEL'),
    'crypto_address' => env('DONATE_CRYPTO_ADDRESS'),

    // Where to reach you about supporting the project in some other way —
    // hosting credit, a translation, a bug report.
    'contact_email' => env('DONATE_CONTACT_EMAIL'),

];
