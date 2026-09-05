<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Notifications\Notification;

/**
 * Sent to the GUEST when the owner confirms their booking request
 * (see ReservationService::confirm()).
 */
class ReservationConfirmedNotification extends Notification
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
            'type' => 'reservation_confirmed',
            'reservation_id' => $this->reservation->id,
            'property_id' => $this->reservation->property_id,
            'property_title' => $this->reservation->property->title,
            'message' => "Votre réservation pour \"{$this->reservation->property->title}\" a été confirmée.",
        ];
    }
}
