<?php

namespace App\Models;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'reservation_id',
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
            'provider' => PaymentProvider::class,
            'status' => PaymentStatus::class,
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
