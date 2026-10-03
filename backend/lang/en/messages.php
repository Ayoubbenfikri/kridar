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
        'avatar_updated' => 'Profile photo updated.',
        'avatar_removed' => 'Profile photo removed.',
        'password_updated' => 'Password updated.',
        'password_reset_link_sent' => 'If an account exists for that email, a password reset link has been sent.',
        'password_reset_success' => 'Your password has been reset. You can now log in.',
        'password_reset_invalid_token' => 'This password reset link is invalid or has expired.',

        // The reset email itself (AppServiceProvider::boot(),
        // ResetPassword::toMailUsing()) - kept here with the rest of the
        // auth strings rather than hardcoded in the provider, same
        // "every language file stays structurally identical" rule as
        // everything else in this file.
        'password_reset_mail_subject' => 'Reset your Krihouse password',
        'password_reset_mail_greeting' => 'Hello :name,',
        'password_reset_mail_line1' => 'We received a request to reset the password for your Krihouse account.',
        'password_reset_mail_action' => 'Reset my password',
        'password_reset_mail_expiry' => 'This link will expire in :count minutes.',
        'password_reset_mail_line2' => "If you didn't request this, you can safely ignore this email — your password won't change.",
        'password_reset_mail_salutation' => 'The Krihouse team',
        'terms_required' => 'You must accept the Terms of Use and Privacy Policy.',
        'account_deleted' => 'Your account has been deleted.',
        'account_deletion_forbidden_admin' => 'Admin accounts cannot be deleted from this page.',
        'account_deletion_blocked_reservations' => 'You have an upcoming reservation (as guest or as owner). Wait until it is completed, or cancel it, before deleting your account.',
    ],

    'admin' => [
        'forbidden' => 'Admin access required.',
    ],

];
