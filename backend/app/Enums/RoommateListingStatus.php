<?php

namespace App\Enums;

/**
 * Deliberately simpler than PropertyStatus: no pending_review state,
 * since roommate posts still publish instantly with no admin review
 * queue (a product decision, not a technical limitation).
 *
 * Suspended was added for admin moderation (mirrors PropertyStatus):
 * an admin can take a bad post down without deleting it. A suspended
 * post behaves exactly like a draft for public visibility — it just
 * disappears from paginatePublished() — but the poster cannot bring it
 * back themselves (RoommateListingService::publish()/unpublish() are
 * the only ways to change status from the user side, and the admin
 * endpoints are the only way in or out of Suspended).
 */
enum RoommateListingStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Suspended = 'suspended';
    case Archived = 'archived';
}
