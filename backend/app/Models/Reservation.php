<?php

namespace App\Models;

use App\Enums\RentalType;
use App\Enums\ReservationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'guest_id',
        'rental_type',
        'start_date',
        'end_date',
        'unit_price',
        'total_price',
        'guests_count',
        'status',
        'cancellation_reason',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'rental_type' => RentalType::class,
            'status' => ReservationStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'cancelled_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
