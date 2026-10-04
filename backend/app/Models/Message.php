<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    /**
     * edited_at and deleted_at are deliberately NOT here — same reasoning
     * as role/status/terms_accepted_at on User: a request body must never
     * be able to fake "this was edited" or undelete/delete a message by
     * itself. EloquentConversationRepository::updateMessage()/
     * deleteMessage() are the only two places that ever set either one,
     * and both do it by direct property assignment, not mass assignment.
     *
     * @var list<string>
     */
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'read_at',
        'shared_property_id',
        'shared_roommate_listing_id',
    ];

    /**
     * Every relation a message might carry a "shared listing" attachment
     * with, for either listing kind — eager-loaded together wherever a
     * message is shown so MessageResource never N+1s. Harmless to load
     * both: whichever id is null simply resolves to a null relation.
     *
     * Only the columns the shared-listing preview card actually needs —
     * see MessageResource — plus the full `images` collection, since the
     * cover photo is picked by is_cover rather than always being the
     * first row (same reasoning as PropertyResource/RoommateListingResource).
     */
    public const SHARED_LISTING_WITH = [
        'sharedProperty:id,title,slug,city,listing_type,price_per_night,price_per_month,sale_price,currency',
        'sharedProperty.images',
        'sharedRoommateListing:id,title,type,city,price_per_person,budget_min,budget_max,currency',
        'sharedRoommateListing.images',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * The property this message optionally shares — the "Partager une
     * annonce" button. At most one of sharedProperty/sharedRoommateListing
     * is ever non-null on a given message (enforced in MessagingService,
     * not here — same "two nullable FKs" convention as Conversation's own
     * property()/roommateListing()).
     */
    public function sharedProperty(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'shared_property_id');
    }

    public function sharedRoommateListing(): BelongsTo
    {
        return $this->belongsTo(RoommateListing::class, 'shared_roommate_listing_id');
    }
}
