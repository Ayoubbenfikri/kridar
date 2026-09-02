<?php

namespace App\Enums;

/**
 * On `properties`, any of the three values is valid (what the owner offers).
 * On `reservations`, only ShortTerm or LongTerm is ever stored — a single
 * booking is always one or the other. That rule is enforced in
 * ReservationService (Phase 8), not at the database level.
 */
enum RentalType: string
{
    case ShortTerm = 'short_term';
    case LongTerm = 'long_term';
    case Both = 'both';
}
