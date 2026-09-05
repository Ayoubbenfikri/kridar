<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Property;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    private const PROPERTY_SUMMARY_COLUMNS = 'property:id,title,slug,city,price_per_night,price_per_month';

    public function __construct(
        private readonly ReservationService $reservations,
    ) {}

    /**
     * GET /reservations — the current user's own bookings, as a guest.
     */
    public function index(Request $request): JsonResponse
    {
        return ReservationResource::collection(
            $this->reservations->listForGuest($request->user())
        )->response();
    }

    /**
     * POST /reservations — create a booking request (always starts
     * "pending", see ReservationService::create()).
     */
    public function store(StoreReservationRequest $request): JsonResponse
    {
        $property = Property::findOrFail($request->validated('property_id'));

        $reservation = $this->reservations->create($request->validated(), $property, $request->user());

        return response()->json([
            'message' => 'Booking request sent. The owner has 48 hours to confirm it.',
            'reservation' => new ReservationResource($reservation->load(self::PROPERTY_SUMMARY_COLUMNS)),
        ], 201);
    }

    public function show(Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        return response()->json([
            'reservation' => new ReservationResource($reservation->load([self::PROPERTY_SUMMARY_COLUMNS, 'guest:id,name'])),
        ]);
    }

    /**
     * PATCH /reservations/{reservation}/confirm — owner accepts the request.
     */
    public function confirm(Reservation $reservation): JsonResponse
    {
        $this->authorize('confirm', $reservation);

        $reservation = $this->reservations->confirm($reservation);

        return response()->json([
            'message' => 'Reservation confirmed.',
            'reservation' => new ReservationResource($reservation->load(self::PROPERTY_SUMMARY_COLUMNS)),
        ]);
    }

    /**
     * PATCH /reservations/{reservation}/reject — owner declines the request.
     */
    public function reject(Reservation $reservation): JsonResponse
    {
        $this->authorize('reject', $reservation);

        $reservation = $this->reservations->reject($reservation);

        return response()->json([
            'message' => 'Reservation rejected.',
            'reservation' => new ReservationResource($reservation->load(self::PROPERTY_SUMMARY_COLUMNS)),
        ]);
    }

    /**
     * PATCH /reservations/{reservation}/cancel — guest or owner cancels.
     */
    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('cancel', $reservation);

        $reservation = $this->reservations->cancel($reservation, $request->user(), $request->input('reason'));

        return response()->json([
            'message' => 'Reservation cancelled.',
            'reservation' => new ReservationResource($reservation->load(self::PROPERTY_SUMMARY_COLUMNS)),
        ]);
    }
}
