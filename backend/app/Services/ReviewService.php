<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Exceptions\ReviewNotAllowedException;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Notifications\ReviewRepliedNotification;
use App\Notifications\ReviewSubmittedNotification;
use App\Repositories\Contracts\ReviewRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ReviewService
{
    public function __construct(
        private readonly ReviewRepositoryInterface $reviews,
    ) {}

    public function listForProperty(Property $property, int $perPage = 15): LengthAwarePaginator
    {
        return $this->reviews->paginateForProperty($property->id, $perPage);
    }

    /**
     * @param  array<string, mixed>  $data  validated StoreReviewRequest data
     */
    public function createForReservation(Reservation $reservation, array $data): Review
    {
        if ($reservation->status !== ReservationStatus::Completed) {
            throw new ReviewNotAllowedException('You can only review a completed stay.');
        }

        // The DB has a unique constraint on reservation_id too — this
        // check just gives a clean 409 instead of a raw SQL error.
        if ($reservation->review()->exists()) {
            throw new ReviewNotAllowedException('This reservation has already been reviewed.');
        }

        $review = $this->reviews->create([
            'reservation_id' => $reservation->id,
            'property_id' => $reservation->property_id,
            'guest_id' => $reservation->guest_id,
            'rating' => $data['rating'],
            'comment' => $data['comment'],
        ]);

        $review->property->owner->notify(new ReviewSubmittedNotification($review));

        return $review;
    }

    /**
     * @param  array<string, mixed>  $data  validated ReplyReviewRequest data
     */
    public function reply(Review $review, array $data): Review
    {
        if ($review->owner_reply !== null) {
            throw new ReviewNotAllowedException('This review already has a reply.');
        }

        $review = $this->reviews->update($review, [
            'owner_reply' => $data['owner_reply'],
            'owner_replied_at' => now(),
        ]);

        $review->guest->notify(new ReviewRepliedNotification($review));

        return $review;
    }
}
