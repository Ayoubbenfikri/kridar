<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\User
 *
 * ⚠️ This resource exposes email AND phone. It is meant for a user's OWN
 * data (/auth/me, /auth/profile) and for admin screens — never for
 * showing one user to another. The property's owner used to be
 * serialized through it, which was safe only because the query happened
 * to select `owner:id,name`; PropertyResource now builds its own
 * minimal owner block instead. Do not reintroduce this resource
 * anywhere a stranger can read it.
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'show_phone_on_listings' => (bool) $this->show_phone_on_listings,
            'role' => $this->role,
            'status' => $this->status,
            'email_verified' => ! is_null($this->email_verified_at),
            'created_at' => $this->created_at,
        ];
    }
}
