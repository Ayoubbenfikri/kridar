<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by PropertyService::publish() when a listing that appears in
 * long-term search (rental_type long_term or both) has not paid its
 * publication fee yet.
 *
 * 402 Payment Required rather than the 409 the other domain exceptions
 * use: the frontend needs to tell "you cannot publish this at all" apart
 * from "you cannot publish this YET, pay first and the button works" —
 * only the second one should offer a Pay button.
 */
class PublicationFeeRequiredException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 402);
    }
}
