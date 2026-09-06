<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by PropertyService::publish() when the property is currently
 * suspended by an admin - only App\Services\AdminService::approveProperty()
 * can bring a suspended property back, not the owner's own publish button
 * (otherwise an admin suspension would have no real effect).
 */
class PropertySuspendedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
