<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $payments,
    ) {}

    /**
     * POST /reservations/{reservation}/payments — the guest starts a
     * payment for their own confirmed reservation.
     */
    public function store(Reservation $reservation): JsonResponse
    {
        $this->authorize('initiatePayment', $reservation);

        $result = $this->payments->initiate($reservation);

        return response()->json([
            'message' => 'Payment initiated. Redirect the guest to redirect_url to complete it.',
            'payment' => new PaymentResource($result['payment']),
            'redirect_url' => $result['redirect_url'],
        ], 201);
    }

    /**
     * GET /reservations/{reservation}/payments — every payment attempt
     * for this reservation (retries included). Same viewers as the
     * reservation itself: guest, property owner, or admin.
     */
    public function indexForReservation(Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        return response()->json([
            'data' => PaymentResource::collection($this->payments->listForReservation($reservation)),
        ]);
    }

    public function show(Payment $payment): JsonResponse
    {
        $this->authorize('view', $payment);

        return response()->json([
            'payment' => new PaymentResource($payment),
        ]);
    }

    /**
     * POST /payments/{payment}/callback — PUBLIC. In production this is
     * called by CMI's servers directly (no logged-in session), so it
     * can't sit behind auth:sanctum. Right now it's driven by hand (or
     * by test-payments.ps1) to simulate CMI notifying us — see the
     * security TODO on FakeCmiGateway::handleCallback().
     */
    public function callback(Request $request, Payment $payment): JsonResponse
    {
        $payment = $this->payments->handleCallback($payment, $request);

        return response()->json([
            'message' => 'Callback processed.',
            'payment' => new PaymentResource($payment),
        ]);
    }
}
