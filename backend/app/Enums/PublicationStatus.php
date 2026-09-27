<?php

namespace App\Enums;

/**
 * Tracks the listing publication fee (Phase 22, redefined in Phase 29).
 *
 *   PropertyStatus      — the listing's lifecycle (draft, published,
 *                         suspended by an admin, archived...)
 *   PublicationStatus   — has the owner paid the fee that unlocks
 *                         publishing?
 *
 * Reading them together gives the full business picture:
 *   pending_payment + draft      → fee not paid, not public
 *   paid            + draft      → fee paid (or free), owner hasn't clicked publish yet
 *   paid            + published  → live
 *
 * Phase 29 (monetization overhaul) redefined what null and paid mean —
 * the fee no longer depends on rental_type at all, it depends on whether
 * this is the owner's first-ever listing:
 *
 *   null            — a row created before Phase 29. Grandfathered: it
 *                     never owed anything under the old rental-type
 *                     rule, and adding this column does not retroactively
 *                     charge anyone for a listing that already existed.
 *   paid            — either the owner's one free first listing (see
 *                     PropertyService::create()) or an additional
 *                     listing whose fee was actually paid. Both read the
 *                     same from here on purpose: once settled, WHY it is
 *                     settled does not matter to anything downstream.
 *   pending_payment — an additional listing, fee owed, not yet paid —
 *                     the only value that actually blocks publishing.
 *
 * See Property::requiresPublicationFee().
 */
enum PublicationStatus: string
{
    case PendingPayment = 'pending_payment';
    case Paid = 'paid';
}
