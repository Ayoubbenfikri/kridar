<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by AdminService for admin actions that aren't allowed on their
 * target, regardless of who is calling - e.g. suspending another admin.
 */
class AdminActionNotAllowedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
