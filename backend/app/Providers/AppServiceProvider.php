<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Laravel's default ResetPassword notification links to a backend
        // 'password.reset' route — but this is a decoupled API with no
        // Blade page of its own to land the user on. Point the emailed
        // link at the frontend's /reset-password page instead; that page
        // reads token+email from the URL and calls
        // POST /api/v1/auth/reset-password itself (AuthController::resetPassword).
        ResetPassword::createUrlUsing(
            fn ($notifiable, string $token) => self::resetPasswordUrl($notifiable, $token)
        );

        // Laravel's default reset email ("Hello!", a generic button,
        // "Regards, Kridar") works but reads like a framework default, not
        // like Krihouse. This swaps in branded copy - pulled from the same
        // lang/{locale}/messages.php files AuthController uses, so the
        // email speaks whichever language the request already came in
        // (SetLocale), rather than hardcoding one language here.
        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            // toMailUsing's callback gets ($notifiable, $token), not the
            // built URL — createUrlUsing above runs independently, Laravel
            // gives this callback no access to its result, so the same
            // URL is built again via the shared helper below.
            $url = self::resetPasswordUrl($notifiable, $token);
            $expiresInMinutes = config('auth.passwords.users.expire');

            return (new MailMessage)
                ->subject(__('messages.auth.password_reset_mail_subject'))
                ->greeting(__('messages.auth.password_reset_mail_greeting', ['name' => $notifiable->name]))
                ->line(__('messages.auth.password_reset_mail_line1'))
                ->action(__('messages.auth.password_reset_mail_action'), $url)
                ->line(__('messages.auth.password_reset_mail_expiry', ['count' => $expiresInMinutes]))
                ->line(__('messages.auth.password_reset_mail_line2'))
                ->salutation(__('messages.auth.password_reset_mail_salutation'));
        });
    }

    /**
     * Shared by both callbacks above, so the URL is built the exact same
     * way regardless of which one runs — the frontend's own
     * /reset-password page, not a Laravel route (see boot()'s first
     * comment for why).
     */
    private static function resetPasswordUrl($notifiable, string $token): string
    {
        $email = urlencode($notifiable->getEmailForPasswordReset());

        return rtrim(config('app.frontend_url'), '/')."/reset-password?token={$token}&email={$email}";
    }
}
