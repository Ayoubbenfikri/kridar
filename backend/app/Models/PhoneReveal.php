<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per (user, property) pair that has paid to see that listing's
 * owner phone number. The unique constraint on the migration is the real
 * guard against paying twice; this model has no extra behaviour on top.
 */
class PhoneReveal extends Model
{
    protected $fillable = [
        'user_id',
        'property_id',
        'payment_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
