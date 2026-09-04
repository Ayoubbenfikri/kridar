<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by ReservationService::create() when the requested dates are no
 * longer free by the time the availability check runs inside the locked
 * transaction (e.g. another guest's request was confirmed a moment
 * earlier). Laravel calls render() automatically to turn this into a
 * proper HTTP response — no changes needed in bootstrap/app.php.
 */
class PropertyNotAvailableException extends Exception
{
    public function __construct(string $message = 'These dates are no longer available for this property.')
    {
        parent::__construct($message);
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
