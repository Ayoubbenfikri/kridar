<?php

namespace App\Models;

use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use App\Enums\PublicationStatus;
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
        // Phase 22 (pricing) — set by PaymentService when the owner's
        // publication fee is confirmed paid, never by an owner's own
        // create/update request (they are not in StorePropertyRequest).
        'publication_status',
        'publication_paid_at',
    ];

    protected function casts(): array
    {
        return [
            'property_type' => PropertyType::class,
            'rental_type' => RentalType::class,
            'status' => PropertyStatus::class,
            'publication_status' => PublicationStatus::class,
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
            'publication_paid_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'price_per_night' => 'decimal:2',
            'price_per_month' => 'decimal:2',
        ];
    }

    /**
     * Phase 22 (pricing): does this listing owe the publication fee?
     *
     * Yes as soon as it appears in long-term search — so `long_term`
     * AND `both`. A `both` listing uses the paid long-term service, so
     * it pays like any other long-term listing (and Kridar still takes
     * its commission on that same listing's short-term bookings).
     *
     * This method is THE rule. Everything else (PropertyService::publish,
     * PaymentService, PropertyResource) asks it instead of re-testing
     * rental_type, so the rule can only ever change in one place.
     */
    public function requiresPublicationFee(): bool
    {
        return in_array($this->rental_type, [RentalType::LongTerm, RentalType::Both], true);
    }

    public function publicationFeePaid(): bool
    {
        return $this->publication_status === PublicationStatus::Paid;
    }

    /**
     * True when the fee is owed and not yet settled — the one case where
     * publishing must be refused.
     */
    public function isBlockedByPublicationFee(): bool
    {
        return $this->requiresPublicationFee() && ! $this->publicationFeePaid();
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

    /**
     * Phase 22 (pricing): the publication-fee payment attempts for this
     * listing. Reservation payments are NOT here — they hang off the
     * reservation (see Reservation::payments()).
     */
    public function publicationPayments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'property_amenity');
    }
}
