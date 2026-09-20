<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Message
 */
class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,

            'sender' => [
                'id' => $this->sender_id,
                'name' => $this->sender?->name,
            ],

            // Which side of the thread to render this on. Computed here
            // rather than compared in the component, so the rule lives
            // with the data.
            'is_mine' => $request->user()?->id === $this->sender_id,

            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
