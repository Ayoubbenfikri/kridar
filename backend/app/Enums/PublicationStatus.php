<?php

namespace App\Enums;

/**
 * Tracks ONLY the long-term listing publication fee (Phase 22 —
 * pricing). It is deliberately separate from PropertyStatus:
 *
 *   PropertyStatus      — the listing's lifecycle (draft, published,
 *                         suspended by an admin, archived...)
 *   PublicationStatus   — has the owner paid the fee that unlocks
 *                         publishing?
 *
 * Reading them together gives the full business picture:
 *   pending_payment + draft      → fee not paid, not public
 *   paid            + draft      → fee paid, owner hasn't clicked publish yet
 *   paid            + published  → live
 *
 * Null (no value at all) means the property never owes a fee — it is
 * short-term only. See Property::requiresPublicationFee().
 */
enum PublicationStatus: string
{
    case PendingPayment = 'pending_payment';
    case Paid = 'paid';
}
