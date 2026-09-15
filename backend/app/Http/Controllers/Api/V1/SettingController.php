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

    public function index(): JsonResponse
    {
        return response()->json([
            'settings' => $this->settings->all(),
        ]);
    }
}
