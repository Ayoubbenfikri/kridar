<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by PaymentService::initiate() when the reservation isn't in a
 * state that can be paid right now (not confirmed yet, or already paid).
 */
class PaymentNotAllowedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
