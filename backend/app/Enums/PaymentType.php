<?php

namespace App\Enums;

/**
 * Kridar's revenue streams, all stored on the same `payments` table:
 *
 *   Reservation        — a guest paying for a short-term booking. Kept
 *                        for schema/history compatibility, but DORMANT
 *                        since Phase 29: the commission model was
 *                        replaced by the flows below, and PricingService
 *                        forces the commission to 0 (see that class).
 *   ListingPublication — an owner paying the fee for an ADDITIONAL
 *                        listing (Phase 29: every owner's first-ever
 *                        listing is free, whatever its rental_type — see
 *                        Property::isBlockedByPublicationFee()).
 *   PhoneReveal         — a user paying once to reveal one owner's phone
 *                        number on one listing (Phase 29). Independent
 *                        of messaging — see PhoneReveal model.
 *   MessagingPack       — a user paying for a 7 or 15 day unlimited
 *                        messaging pass, once their 5 free contacts are
 *                        used up (Phase 29). See MessagingPass model.
 */
enum PaymentType: string
{
    case Reservation = 'reservation';
    case ListingPublication = 'listing_publication';
    case PhoneReveal = 'phone_reveal';
    case MessagingPack = 'messaging_pack';
}
