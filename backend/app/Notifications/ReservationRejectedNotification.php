<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Notifications\Notification;

/**
 * Sent to the GUEST when the owner rejects their booking request
 * (see ReservationService::reject()).
 */
class ReservationRejectedNotification extends Notification
{
    public function __construct(
        private readonly Reservation $reservation,
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
            'type' => 'reservation_rejected',
            'reservation_id' => $this->reservation->id,
            'property_id' => $this->reservation->property_id,
            'property_title' => $this->reservation->property->title,
            'message' => "Votre demande de réservation pour \"{$this->reservation->property->title}\" a été refusée.",
        ];
    }
}
