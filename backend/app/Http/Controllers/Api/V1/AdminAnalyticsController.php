<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AnalyticsReportRequest;
use App\Services\AnalyticsReportService;
use Illuminate\Http\JsonResponse;

/**
 * Admin analytics (Phase A2) - the reading side. Its own controller
 * rather than one more method on AdminController, which already covers
 * users, listings, payments, settings and the audit trail.
 *
 * Protected by the /admin route group (auth:sanctum + admin + throttle),
 * see routes/api/admin.php.
 */
class AdminAnalyticsController extends Controller
{
    public function __construct(
        private readonly AnalyticsReportService $reports,
    ) {}

    /**
     * GET /admin/analytics?range=7d|30d|90d (default 30d).
     */
    public function index(AnalyticsReportRequest $request): JsonResponse
    {
        return response()->json([
            'range' => $request->range(),
            ...$this->reports->build($request->days()),
        ]);
    }
}
