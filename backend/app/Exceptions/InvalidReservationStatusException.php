<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by ReservationService when an action (confirm/reject/cancel) is
 * attempted on a reservation whose current status doesn't allow it — e.g.
 * confirming a reservation that was already rejected.
 */
class InvalidReservationStatusException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
