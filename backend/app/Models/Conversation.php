<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A message thread between one interested person and the owner of one
 * listing — a property (Phase 24) or, since Phase R2, a roommate post.
 *
 * Exactly one of property_id / roommate_listing_id is ever set for a
 * given row (enforced in MessagingService, not the database — same
 * convention as the rest of this codebase). Every method below reads
 * through "whichever listing relation is set", so the rest of the app
 * (ConversationPolicy, notifications, the inbox query) did not need to
 * learn there are now two kinds of listing.
 */
class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'roommate_listing_id',
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

    public function roommateListing(): BelongsTo
    {
        return $this->belongsTo(RoommateListing::class);
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
     * The owner's id, read through whichever listing is set. Null only
     * if that relation has not been loaded — in practice always present.
     */
    public function ownerId(): ?int
    {
        return $this->property?->owner_id ?? $this->roommateListing?->user_id;
    }

    /**
     * The OTHER person, from $userId's point of view. Two people are in
     * a thread; this is whichever one is not the viewer.
     */
    public function counterpartFor(int $userId): ?User
    {
        return $userId === $this->guest_id
            ? ($this->property?->owner ?? $this->roommateListing?->user)
            : $this->guest;
    }

    public function involves(int $userId): bool
    {
        return $userId === $this->guest_id || $userId === $this->ownerId();
    }
}
