<?php

namespace App\Models;

use App\Enums\AnalyticsEventName;
use Illuminate\Database\Eloquent\Model;

/**
 * One page view or tracked action (Phase A1). Written only by
 * AnalyticsService, read only by the admin analytics (Phase A2).
 */
class AnalyticsEvent extends Model
{
    /** The table has created_at only: an event is never updated. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'path',
        'property_id',
        'roommate_listing_id',
        'visitor_hash',
        'is_authenticated',
        'is_entry',
        'referrer_host',
        'utm_source',
        'device',
        'locale',
    ];

    protected function casts(): array
    {
        return [
            'name' => AnalyticsEventName::class,
            'is_authenticated' => 'boolean',
            'is_entry' => 'boolean',
            'created_at' => 'datetime',
        ];
    }
}
