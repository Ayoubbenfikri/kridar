<?php

namespace App\Models;

use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Enums\RentalType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'title',
        'slug',
        'description',
        'property_type',
        'rental_type',
        'address',
        'city',
        'region',
        'country',
        'latitude',
        'longitude',
        'bedrooms',
        'bathrooms',
        'max_guests',
        'area_sqm',
        'price_per_night',
        'price_per_month',
        'currency',
        'status',
        'is_featured',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'property_type' => PropertyType::class,
            'rental_type' => RentalType::class,
            'status' => PropertyStatus::class,
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'price_per_night' => 'decimal:2',
            'price_per_month' => 'decimal:2',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('sort_order');
    }

    public function blockedDates(): HasMany
    {
        return $this->hasMany(PropertyBlockedDate::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'property_amenity');
    }
}
