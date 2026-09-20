<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A message thread between one interested person and the owner of one
 * property (Phase 24).
 *
 * The owner side is derived, never stored — see owner().
 */
class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'guest_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /** The person who started the thread — never the owner. */
    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * The owner's id, read through the property. Null only if the
     * property relation has not been loaded and cannot be — in practice
     * always present.
     */
    public function ownerId(): ?int
    {
        return $this->property?->owner_id;
    }

    /**
     * The OTHER person, from $userId's point of view. Two people are in
     * a thread; this is whichever one is not the viewer.
     */
    public function counterpartFor(int $userId): ?User
    {
        return $userId === $this->guest_id
            ? $this->property?->owner
            : $this->guest;
    }

    public function involves(int $userId): bool
    {
        return $userId === $this->guest_id || $userId === $this->ownerId();
    }
}
