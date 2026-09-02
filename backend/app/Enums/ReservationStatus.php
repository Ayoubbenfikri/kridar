<?php

namespace App\Enums;

enum ReservationStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
    case Completed = 'completed';

    /**
     * Statuses that occupy the calendar — used by the Phase 8 availability
     * check (a pending request holds the dates just like a confirmed one).
     *
     * @return array<int, self>
     */
    public static function blocksAvailability(): array
    {
        return [self::Pending, self::Confirmed];
    }
}
