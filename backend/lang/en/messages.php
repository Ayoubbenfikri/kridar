<?php

/*
|--------------------------------------------------------------------------
| Kridar's own messages — English
|--------------------------------------------------------------------------
|
| These are the strings that used to be hardcoded in AuthController and
| the two middlewares, moved here unchanged so nothing about the English
| behaviour shifts while the other two languages are added.
|
| Keep the three files (fr, en, ary) structurally identical: a key present
| in one and missing in another falls back silently and ships an
| untranslated string to a real user.
|
*/

return [

    'auth' => [
        'registered' => 'Registered successfully. Check your email to verify your account.',
        'invalid_credentials' => 'These credentials do not match our records.',
        'suspended' => 'This account has been suspended.',
        'logged_out' => 'Logged out.',
        'email_verified' => 'Email verified successfully.',
        'email_already_verified' => 'Email already verified.',
        'verification_sent' => 'Verification link sent.',
        'invalid_verification_link' => 'Invalid verification link.',
        'profile_updated' => 'Profile updated.',
        'password_updated' => 'Password updated.',
    ],

    'admin' => [
        'forbidden' => 'Admin access required.',
    ],

];
