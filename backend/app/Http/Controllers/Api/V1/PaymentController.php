<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Property;
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
     * POST /properties/{property}/publication-payment — Phase 22
     * (pricing). The owner pays the one-off fee that lets a long-term
     * listing go live.
     *
     * Authorized by PropertyPolicy::update() (owner or admin), the same
     * gate as publishing — whoever may publish the listing may pay for
     * it. The AMOUNT is never in the request: PaymentService reads it
     * from SettingService.
     *
     * redirect_url is null when the admin has set the fee to 0 — the
     * listing is already live and there is nowhere to redirect to.
     */
    public function storeForProperty(Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $result = $this->payments->initiateListingPublication($property);

        return response()->json([
            'message' => $result['redirect_url'] === null
                ? 'Publication is currently free — the listing is now live.'
                : 'Payment initiated. Redirect the owner to redirect_url to complete it.',
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
     *
     * Handles both kinds of payment: for a listing-publication payment,
     * a successful callback is also what takes the listing live.
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
