<?php

/*
|--------------------------------------------------------------------------
| Kridar's own messages — French
|--------------------------------------------------------------------------
|
| The strings the application itself returns, as opposed to Laravel's
| built-in validation messages (those live in validation.php, created by
| `php artisan lang:publish`).
|
| Phase 27 covers the auth path only — it is what a visitor hits first and
| what the language switcher exercises immediately. The admin, booking,
| payment and messaging messages are still hardcoded English in their
| services and move here in a later step.
|
| Keep the three files (fr, en, ary) structurally identical: a key present
| in one and missing in another falls back silently and ships an
| untranslated string to a real user.
|
*/

return [

    'auth' => [
        'registered' => 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
        'invalid_credentials' => 'Ces identifiants ne correspondent à aucun compte.',
        'suspended' => 'Ce compte a été suspendu.',
        'logged_out' => 'Vous êtes déconnecté.',
        'email_verified' => 'Email vérifié avec succès.',
        'email_already_verified' => 'Cet email est déjà vérifié.',
        'verification_sent' => 'Lien de vérification envoyé.',
        'invalid_verification_link' => 'Lien de vérification invalide.',
        'profile_updated' => 'Profil mis à jour.',
        'password_updated' => 'Mot de passe mis à jour.',
    ],

    'admin' => [
        'forbidden' => 'Accès administrateur requis.',
    ],

];
