<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\ReplyReviewRequest;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviews,
    ) {}

    /**
     * GET /properties/{property}/reviews — public.
     */
    public function indexForProperty(Property $property): JsonResponse
    {
        return ReviewResource::collection($this->reviews->listForProperty($property))
            ->response();
    }

    /**
     * POST /reservations/{reservation}/review — auth, only the guest of
     * that reservation, only once it's completed.
     */
    public function store(StoreReviewRequest $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('create', [Review::class, $reservation]);

        $review = $this->reviews->createForReservation($reservation, $request->validated());

        return response()->json([
            'message' => 'Review submitted.',
            'review' => new ReviewResource($review->load('guest:id,name')),
        ], 201);
    }

    /**
     * PATCH /reviews/{review} — auth, only the property owner, reply only
     * (the guest's rating/comment can't be edited through this endpoint).
     */
    public function reply(ReplyReviewRequest $request, Review $review): JsonResponse
    {
        $this->authorize('reply', $review);

        $review = $this->reviews->reply($review, $request->validated());

        return response()->json([
            'message' => 'Reply added.',
            'review' => new ReviewResource($review->load('guest:id,name')),
        ]);
    }
}
