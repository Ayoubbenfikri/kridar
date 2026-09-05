<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Notifications\Notification;

/**
 * Sent to the property OWNER when a guest sends a new booking request
 * (see ReservationService::create()). In-app only for now (database
 * channel) - email can be added later by adding 'mail' to via().
 */
class ReservationRequestedNotification extends Notification
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
            'type' => 'reservation_requested',
            'reservation_id' => $this->reservation->id,
            'property_id' => $this->reservation->property_id,
            'property_title' => $this->reservation->property->title,
            'message' => "Nouvelle demande de réservation pour \"{$this->reservation->property->title}\".",
        ];
    }
}
