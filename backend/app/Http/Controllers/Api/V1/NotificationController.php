<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    /**
     * GET /notifications — the current user's own notifications, most
     * recent first. No Policy needed here (or below) - NotificationService
     * always scopes by $request->user()->id itself, so there's nothing to
     * separately authorize.
     */
    public function index(Request $request): JsonResponse
    {
        return NotificationResource::collection(
            $this->notifications->listForUser($request->user())
        )->response();
    }

    /**
     * PATCH /notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $this->notifications->markAsRead($request->user(), $id);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * PATCH /notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $this->notifications->markAllAsRead($request->user());

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
