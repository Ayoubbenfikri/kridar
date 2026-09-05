<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Notifications\Notification;

/**
 * Sent to the property OWNER when a guest leaves a review
 * (see ReviewService::createForReservation()).
 */
class ReviewSubmittedNotification extends Notification
{
    public function __construct(
        private readonly Review $review,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'review_submitted',
            'review_id' => $this->review->id,
            'property_id' => $this->review->property_id,
            'property_title' => $this->review->property->title,
            'rating' => $this->review->rating,
            'message' => "Vous avez reçu un nouvel avis ({$this->review->rating}/5) pour \"{$this->review->property->title}\".",
        ];
    }
}
