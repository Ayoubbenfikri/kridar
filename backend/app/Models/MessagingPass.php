<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A time-boxed messaging pass (7 or 15 days). See the migration for the
 * lifecycle: created with null starts_at/expires_at at payment-initiate
 * time, filled in by PaymentService::handleCallback() once paid.
 */
class MessagingPass extends Model
{
    protected $fillable = [
        'user_id',
        'payment_id',
        'duration_days',
        'starts_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isFuture();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
