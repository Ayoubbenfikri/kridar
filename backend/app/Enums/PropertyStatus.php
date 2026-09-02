<?php

namespace App\Enums;

enum PropertyStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Published = 'published';
    case Suspended = 'suspended';
    case Archived = 'archived';
}
