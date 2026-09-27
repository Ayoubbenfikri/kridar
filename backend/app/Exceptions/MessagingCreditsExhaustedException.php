<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by MessagingCreditsService when a user has no free contacts left
 * and no active messaging pass, and tries to start a NEW conversation.
 *
 * 402 Payment Required, same convention as PublicationFeeRequiredException:
 * the request is well-formed and the user is allowed to message people in
 * general, they just need to pay first. The frontend uses this status to
 * show "buy a pack" instead of a generic error.
 */
class MessagingCreditsExhaustedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 402);
    }
}
