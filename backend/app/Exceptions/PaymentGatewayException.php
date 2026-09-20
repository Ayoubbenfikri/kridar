<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The payment provider could not be reached, or answered something we
 * cannot act on (no approval link, rejected credentials, a conversion
 * rate that makes no sense).
 *
 * 502 Bad Gateway, deliberately: the request itself was fine, an
 * UPSTREAM service failed. A 500 would suggest a bug in Kridar and send
 * whoever is debugging into the wrong codebase.
 *
 * The message is written to be shown to a user as-is - never put a raw
 * PayPal payload or anything credential-shaped in it.
 */
class PaymentGatewayException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 502);
    }
}
