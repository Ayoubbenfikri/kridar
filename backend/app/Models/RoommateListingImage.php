<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoommateListingImage extends Model
{
    protected $fillable = [
        'roommate_listing_id',
        'path',
        'is_cover',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_cover' => 'boolean',
        ];
    }

    public function roommateListing(): BelongsTo
    {
        return $this->belongsTo(RoommateListing::class);
    }
}
