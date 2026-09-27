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
        // publication fee is confirmed paid, or by PropertyService::create()
        // for a free first listing. Never by an owner's own create/update
        // request (they are not in StorePropertyRequest).
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
     * Phase 29 (monetization overhaul): does this listing sit inside the
     * fee model at all?
     *
     * Deliberately NOT a rental_type check any more. The decision is made
     * once, per OWNER, at Property::create() time (PropertyService::create()):
     * the very first property an owner ever creates is free and stored as
     * `paid` directly; every one after that is `pending_payment` until
     * settled. A null publication_status is a pre-Phase-29 row — it was
     * never part of this model and never owes anything.
     *
     * This method is THE rule. Everything else (PropertyService::publish,
     * PaymentService, PropertyResource, AdminService) asks it (or
     * publicationFeePaid()) instead of re-testing rental_type or the raw
     * column, so the rule can only ever change in one place.
     */
    public function requiresPublicationFee(): bool
    {
        return $this->publication_status !== null;
    }

    public function publicationFeePaid(): bool
    {
        return $this->publication_status === PublicationStatus::Paid;
    }

    /**
     * True when the fee is owed and not yet settled — the one case where
     * publishing must be refused.
     *
     * Phase 28: short-circuits to false while Kridar is free
     * (config('payments.enabled') === false, the current default). This
     * single line is what turns the paid model off — it is THE gate that
     * PropertyService::publish() and PropertyService::update() both ask,
     * so switching it here switches it everywhere at once instead of
     * leaving a copy of the rule in two services to drift apart.
     *
     * Reading config from a model is not something to do casually, but
     * this class already owns the publication-fee rule (see
     * requiresPublicationFee above) and "is there a fee at all" is part
     * of that same rule. Checking it in each caller instead would mean two
     * places to remember and one to forget.
     */
    public function isBlockedByPublicationFee(): bool
    {
        if (! config('payments.enabled')) {
            return false;
        }

        return $this->requiresPublicationFee() && ! $this->publicationFeePaid();
    }

    /**
     * Does this listing publish its owner's phone number at all?
     * Independent of WHO is looking, and independent of whether THIS
     * viewer has paid to reveal it — both of those live in
     * PropertyResource, because they depend on the request.
     *
     * Two conditions, both required:
     *
     *   1. The owner opted in. Off by default: they gave their number to
     *      create an account, not to publish it.
     *   2. There is actually a number.
     *
     * Phase 29 (monetization overhaul): this used to also require
     * requiresPublicationFee() (long-term only) — a short-term guest
     * calling the owner directly used to skip Kridar's commission. Phase
     * 29 removed the short-term commission model entirely (see
     * PricingService, left disabled but intact), so there is nothing left
     * to protect: phone reveal now applies to every published listing,
     * gated instead by its own one-off fee (PhoneReveal / PaymentService::
     * initiatePhoneReveal()).
     *
     * Needs `owner` loaded WITH phone and show_phone_on_listings. When
     * the query only selected owner:id,name (the listing index), both
     * read as null and this safely returns false.
     *
     * It deliberately never loads the owner itself. PropertyResource
     * calls this for EVERY property it serializes, and a plain
     * `$this->owner` on an endpoint that did not eager-load it would
     * fire one extra query per row — an N+1 on every list page. Not
     * loaded means "not asked for here", so the answer is false.
     */
    public function listsOwnerPhone(): bool
    {
        $owner = $this->relationLoaded('owner') ? $this->owner : null;

        return $owner !== null
            && $owner->show_phone_on_listings === true
            && filled($owner->phone);
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

    /**
     * Phase 29 — everyone who has paid to reveal THIS listing's owner
     * phone number. Almost always zero or one row per viewer (the unique
     * constraint), read via PropertyResource for the current viewer only.
     */
    public function phoneReveals(): HasMany
    {
        return $this->hasMany(PhoneReveal::class);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'property_amenity');
    }
}
