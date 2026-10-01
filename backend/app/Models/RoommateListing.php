<?php

namespace App\Models;

use App\Enums\RoommateListingStatus;
use App\Enums\RoommateListingType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoommateListing extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'description',
        'city',
        'neighborhood',
        'address',
        'latitude',
        'longitude',
        'price_per_person',
        'budget_min',
        'budget_max',
        'currency',
        'beds',
        'bedrooms',
        'furnished',
        'people_count',
        'available_from',
        'status',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => RoommateListingType::class,
            'status' => RoommateListingStatus::class,
            'furnished' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'price_per_person' => 'decimal:2',
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
            'available_from' => 'date',
            'published_at' => 'datetime',
        ];
    }

    public function isOffer(): bool
    {
        return $this->type === RoommateListingType::Offer;
    }

    /** The person who posted it — an "offer" poster or a "request" poster, same column either way. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(RoommateListingImage::class)->orderBy('sort_order');
    }

    // conversations() is added in Phase R2, once the conversations table
    // actually has a roommate_listing_id column to hang it off.
}
