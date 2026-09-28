<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Current Terms of Use / Privacy Policy version
    |--------------------------------------------------------------------------
    |
    | One version string covers BOTH documents at once — Terms of Use and
    | Privacy Policy sit behind a single checkbox at registration (see
    | frontend/src/pages/legal/TermsOfUsePage.tsx and PrivacyPolicyPage.tsx),
    | so there is one acceptance record, not two.
    |
    | HOW TO USE THIS WHEN THE WORDING CHANGES LATER (e.g. after a real
    | lawyer reviews the draft text): edit the two legal pages, then bump
    | this string ('v1' -> 'v2'). Nothing else needs to change — every
    | user whose stored users.terms_version no longer matches this value
    | is automatically flagged by UserResource::needs_terms_acceptance and
    | asked to accept again, the same blocking modal a never-accepted
    | account sees. New registrations always accept whatever is current
    | here at signup time (AuthController::register()).
    |
    */
    'terms_version' => env('LEGAL_TERMS_VERSION', 'v1'),

];
