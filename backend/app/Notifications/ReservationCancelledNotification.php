<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Notifications\Notification;

/**
 * Sent to whichever side did NOT cancel (see ReservationService::cancel(),
 * which now takes the acting user so it knows who the "other party" is -
 * either side can cancel, per ReservationPolicy::cancel()).
 */
class ReservationCancelledNotification extends Notification
{
    public function __construct(
        private readonly Reservation $reservation,
        private readonly bool $cancelledByGuest,
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
        $who = $this->cancelledByGuest ? 'le voyageur' : 'le propriétaire';

        return [
            'type' => 'reservation_cancelled',
            'reservation_id' => $this->reservation->id,
            'property_id' => $this->reservation->property_id,
            'property_title' => $this->reservation->property->title,
            'message' => "La réservation pour \"{$this->reservation->property->title}\" a été annulée par {$who}.",
        ];
    }
}
