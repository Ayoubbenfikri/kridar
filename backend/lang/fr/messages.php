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
        'avatar_updated' => 'Photo de profil mise à jour.',
        'avatar_removed' => 'Photo de profil supprimée.',
        'password_updated' => 'Mot de passe mis à jour.',
        'password_reset_link_sent' => 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.',
        'password_reset_success' => 'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.',
        'password_reset_invalid_token' => 'Ce lien de réinitialisation est invalide ou a expiré.',

        'password_reset_mail_subject' => 'Réinitialisez votre mot de passe Krihouse',
        'password_reset_mail_greeting' => 'Bonjour :name,',
        'password_reset_mail_line1' => 'Vous avez demandé la réinitialisation du mot de passe de votre compte Krihouse.',
        'password_reset_mail_action' => 'Réinitialiser mon mot de passe',
        'password_reset_mail_expiry' => 'Ce lien expirera dans :count minutes.',
        'password_reset_mail_line2' => "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité — votre mot de passe ne sera pas modifié.",
        'password_reset_mail_salutation' => "L'équipe Krihouse",
        'terms_required' => 'Vous devez accepter les Conditions d\'Utilisation et la Politique de Confidentialité.',
        'account_deleted' => 'Votre compte a été supprimé.',
        'account_deletion_forbidden_admin' => 'Les comptes administrateur ne peuvent pas être supprimés depuis cette page.',
        'account_deletion_blocked_reservations' => 'Vous avez une réservation à venir (comme voyageur ou comme propriétaire). Attendez qu\'elle soit terminée, ou annulez-la, avant de supprimer votre compte.',
    ],

    'admin' => [
        'forbidden' => 'Accès administrateur requis.',
    ],

];
