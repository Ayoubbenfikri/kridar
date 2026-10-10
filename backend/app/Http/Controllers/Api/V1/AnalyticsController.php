<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Analytics\CollectAnalyticsEventRequest;
use App\Services\AnalyticsService;
use Illuminate\Http\Response;

/**
 * Admin analytics (Phase A1) - the public side: the React app reports
 * page views and important actions here.
 */
class AnalyticsController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analytics,
    ) {}

    /**
     * POST /analytics/collect - public, throttled.
     *
     * Always 204 No Content, even when the event was deliberately not
     * stored (a bot, an admin): the browser has nothing to do with the
     * answer, and telling a script "you were filtered" would only help it
     * get around the filter.
     */
    public function collect(CollectAnalyticsEventRequest $request): Response
    {
        $this->analytics->record($request, $request->validated());

        return response()->noContent();
    }
}
