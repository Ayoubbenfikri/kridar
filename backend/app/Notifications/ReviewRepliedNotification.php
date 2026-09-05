<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Notifications\Notification;

/**
 * Sent to the GUEST when the owner replies to their review
 * (see ReviewService::reply()).
 */
class ReviewRepliedNotification extends Notification
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
            'type' => 'review_replied',
            'review_id' => $this->review->id,
            'property_id' => $this->review->property_id,
            'property_title' => $this->review->property->title,
            'message' => "Le propriétaire a répondu à votre avis sur \"{$this->review->property->title}\".",
        ];
    }
}
