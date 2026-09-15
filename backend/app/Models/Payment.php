<?php

namespace App\Models;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A payment is either for a reservation or for publishing a listing —
 * `type` says which, and exactly one of reservation_id / property_id is
 * filled. Both kinds go through the same PaymentService + gateway.
 */
class Payment extends Model
{
    protected $fillable = [
        'type',
        'reservation_id',
        'property_id',
        'user_id',
        'amount',
        'currency',
        'provider',
        'provider_transaction_id',
        'status',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => PaymentType::class,
            'provider' => PaymentProvider::class,
            'status' => PaymentStatus::class,
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function isListingPublication(): bool
    {
        return $this->type === PaymentType::ListingPublication;
    }

    /** Null on a listing-publication payment. */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    /** Null on a reservation payment. */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
