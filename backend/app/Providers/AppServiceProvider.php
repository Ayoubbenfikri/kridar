<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
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
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return rtrim(config('app.frontend_url'), '/')."/reset-password?token={$token}&email={$email}";
        });
    }
}
