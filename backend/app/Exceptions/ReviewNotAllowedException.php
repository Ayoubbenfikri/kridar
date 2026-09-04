<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by ReviewService when the requested action isn't allowed right
 * now — the reservation isn't completed yet, it's already been reviewed,
 * or the review already has an owner reply.
 */
class ReviewNotAllowedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
