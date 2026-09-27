<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreMessagingPackRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
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
     * POST /properties/{property}/publication-payment — the owner pays
     * the fee for an ADDITIONAL listing (Phase 29 — the first one is
     * always free, see PropertyService::create()).
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
     * POST /properties/{property}/phone-reveal — Phase 29 (monetization
     * overhaul). Pay once to see this listing's owner phone number.
     * Completely independent of messaging credits.
     *
     * Authorized by PropertyPolicy::view() — anyone who may see the
     * listing at all may pay to reveal its number. Whether the listing
     * actually publishes a number, and whether this viewer is the
     * property's own owner (refused, 409), is decided by
     * PaymentService::initiatePhoneReveal(), not here — that keeps the
     * business rule in one place instead of duplicated in the controller.
     */
    public function storePhoneReveal(Request $request, Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $result = $this->payments->initiatePhoneReveal($property, $request->user());

        return response()->json([
            'message' => 'Payment initiated. Redirect to redirect_url to complete it.',
            'payment' => new PaymentResource($result['payment']),
            'redirect_url' => $result['redirect_url'],
        ], 201);
    }

    /**
     * POST /messaging/packs — Phase 29. Buy a 7 or 15 day unlimited
     * messaging pass, once the 5 free contacts are used up.
     */
    public function storeMessagingPack(StoreMessagingPackRequest $request): JsonResponse
    {
        $result = $this->payments->initiateMessagingPack(
            $request->user(),
            $request->validated('duration'),
        );

        return response()->json([
            'message' => 'Payment initiated. Redirect to redirect_url to complete it.',
            'payment' => new PaymentResource($result['payment']),
            'redirect_url' => $result['redirect_url'],
        ], 201);
    }

    /**
     * GET /payments/{payment}/return — PUBLIC, and a browser navigation
     * rather than an API call.
     *
     * This is where the gateway sends the PAYER back after they approve.
     * PayPal arrives here with ?token=<order id>; the fake gateway just
     * arrives. Either way the bound gateway decides the outcome, and
     * this is the moment a PayPal order is actually captured — approval
     * alone moves no money.
     *
     * It cannot sit behind auth:sanctum: the request is a cross-site
     * top-level redirect from paypal.com, and relying on a session
     * cookie surviving that would be fragile. Nothing here trusts the
     * request anyway — PaypalGateway refuses a token that does not match
     * the order id stored on this payment row, so a stranger hitting
     * this URL cannot settle anything.
     *
     * Returns a redirect to the React app, not JSON, because a human is
     * looking at it.
     */
    public function gatewayReturn(Request $request, Payment $payment): RedirectResponse
    {
        $payment = $this->payments->handleCallback($payment, $request);

        return $this->backToFrontend(
            $payment,
            $payment->status === PaymentStatus::Paid ? 'success' : 'failed',
        );
    }

    /**
     * GET /payments/{payment}/cancel — PUBLIC. The payer backed out on
     * the gateway's page. Nothing was charged.
     */
    public function gatewayCancel(Payment $payment): RedirectResponse
    {
        $payment = $this->payments->markCancelled($payment);

        return $this->backToFrontend($payment, 'cancelled');
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
     * POST /payments/{payment}/callback — PUBLIC, JSON.
     *
     * The server-to-server shape, kept for the test-*.ps1 scripts which
     * drive the fake gateway by hand. Real PayPal never lands here; it
     * uses the GET return URL above.
     */
    public function callback(Request $request, Payment $payment): JsonResponse
    {
        $payment = $this->payments->handleCallback($payment, $request);

        return response()->json([
            'message' => 'Callback processed.',
            'payment' => new PaymentResource($payment),
        ]);
    }

    /**
     * Send the browser back to the React app, which lives on another
     * origin in dev (Vite on :5173, Laravel on :8000).
     *
     * The landing page depends on what was being paid for: an owner
     * paying a publication fee wants their listings, a guest paying a
     * booking wants their reservations, someone who just paid to reveal
     * a phone number wants to land back on that exact listing (numeric
     * id, not slug — the frontend routes properties by id), and someone
     * who just bought a messaging pack wants their inbox.
     */
    private function backToFrontend(Payment $payment, string $status): RedirectResponse
    {
        $base = rtrim((string) config('payments.frontend_url'), '/');

        $path = match (true) {
            $payment->isListingPublication() => '/owner/properties',
            $payment->isPhoneReveal() => "/properties/{$payment->property_id}",
            $payment->isMessagingPack() => '/messages',
            default => '/reservations',
        };

        return redirect()->away("{$base}{$path}?payment={$status}");
    }
}
