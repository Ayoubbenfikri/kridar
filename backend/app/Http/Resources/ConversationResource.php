<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Conversation
 *
 * This resource is VIEWER-DEPENDENT, unlike every other one in the app.
 * "The other person" and "unread" only mean something relative to who
 * is asking, so both are computed from $request->user() rather than
 * being properties of the row.
 */
class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewerId = $request->user()?->id;
        $counterpart = $viewerId !== null ? $this->counterpartFor($viewerId) : null;

        return [
            'id' => $this->id,

            'property' => [
                'id' => $this->property?->id,
                'title' => $this->property?->title,
                'slug' => $this->property?->slug,
                'city' => $this->property?->city,
            ],

            // Who the viewer is talking to. Null would mean the property
            // relation was not loaded — every repository query loads it.
            'counterpart' => $counterpart === null ? null : [
                'id' => $counterpart->id,
                'name' => $counterpart->name,
            ],

            // True when the viewer is the one who owns the listing, so
            // the UI can label the thread ("from a visitor" vs "to the
            // owner") without re-deriving it.
            'viewer_is_owner' => $viewerId !== null && $viewerId === $this->ownerId(),

            // Added by withCount in the inbox query; absent on a single
            // conversation, where the thread view knows its own state.
            'unread_count' => (int) ($this->unread_count ?? 0),

            'last_message_at' => $this->last_message_at,
            'created_at' => $this->created_at,
        ];
    }
}
