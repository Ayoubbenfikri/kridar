<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by MessagingService when a conversation cannot be opened —
 * the listing is not published, or the sender owns it.
 *
 * 409, matching the other domain exceptions in this app: the request
 * was well-formed and the caller is authenticated, the current state
 * just does not allow it.
 */
class MessagingNotAllowedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
