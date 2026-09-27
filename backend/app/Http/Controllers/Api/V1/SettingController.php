<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;

/**
 * GET /settings — PUBLIC, read-only.
 *
 * Both numbers are things Kridar advertises rather than hides: the
 * owner must see "Publication de l'annonce : 20 DH" before creating a
 * listing (possibly before even having an account), and the guest must
 * see "Commission Kridar : 10%" on the booking panel. So there is one
 * public read endpoint instead of a duplicate admin one.
 *
 * Writing them is admin-only — see AdminController::updateSettings().
 */
class SettingController extends Controller
{
    public function __construct(
        private readonly SettingService $settings,
    ) {}

    /**
     * Phase 28 adds two things the frontend cannot work out for itself:
     *
     *   payments_enabled  whether Kridar charges for anything at all. The
     *                     interface keys off this — "Publication gratuite"
     *                     instead of a price, no pay buttons, no
     *                     commission line.
     *
     *   support           the donation methods that are actually
     *                     configured, for /support. Empty ones are
     *                     stripped, so the page renders exactly what
     *                     exists and the frontend needs no blank checks.
     *                     Note `currency` always has a value (it has a
     *                     default), so a key being present does not on its
     *                     own mean a payment method exists — the page
     *                     checks the methods themselves.
     *
     * Both come from config rather than the settings table: they are
     * deployment facts, not numbers an admin tunes from the dashboard.
     * Serving them here rather than baking them into the Vite build means
     * changing one is a .env edit plus `php artisan config:clear` — no
     * frontend rebuild.
     *
     * Nothing secret is in config/support.php; see the warning there.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'settings' => [
                ...$this->settings->all(),
                'payments_enabled' => (bool) config('payments.enabled'),
            ],
            'support' => array_filter([
                'paypal_me' => config('support.paypal_me'),
                'currency' => config('support.currency'),
                'donate_url' => config('support.donate_url'),
                'bank_label' => config('support.bank_label'),
                'bank_details' => config('support.bank_details'),
                'crypto_label' => config('support.crypto_label'),
                'crypto_address' => config('support.crypto_address'),
                'contact_email' => config('support.contact_email'),
            ], fn ($value) => filled($value)),
        ]);
    }
}
