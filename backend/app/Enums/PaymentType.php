<?php

namespace App\Enums;

/**
 * Kridar's two revenue streams (Phase 22 — pricing), stored on the same
 * `payments` table:
 *
 *   Reservation        — a guest paying for a short-term booking.
 *                        Kridar's income is the commission snapshotted
 *                        on the reservation, not the whole amount.
 *   ListingPublication — an owner paying the one-off fee to publish a
 *                        long-term ad. The whole amount is Kridar's.
 */
enum PaymentType: string
{
    case Reservation = 'reservation';
    case ListingPublication = 'listing_publication';
}
