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
            'avatar_url' => $this->avatarUrl(),
            'show_phone_on_listings' => (bool) $this->show_phone_on_listings,
            // Phase 27. The frontend reads this on sign-in to restore the
            // language the account chose, whatever this browser had in
            // localStorage.
            'locale' => $this->locale,
            'role' => $this->role,
            'status' => $this->status,
            'email_verified' => ! is_null($this->email_verified_at),

            // Terms of Use / Privacy Policy. True for an account that
            // never accepted (terms_version is still null — every account
            // created before this feature existed) OR whose accepted
            // version no longer matches config('legal.terms_version')
            // because the wording changed since. The frontend's
            // AcceptTermsModal reads this on every /auth/me and blocks
            // the app until it's false.
            'needs_terms_acceptance' => $this->terms_version !== config('legal.terms_version'),

            // Phase 29 (monetization overhaul) — what the messaging
            // paywall UI needs to know about THIS account, without a
            // second request. Both are read fresh (not cached client
            // side) since a conversation started elsewhere can change
            // free_contacts_remaining at any moment.
            'free_contacts_remaining' => $this->free_contacts_remaining,
            'messaging_pack_expires_at' => $this->activeMessagingPass()?->expires_at,

            'created_at' => $this->created_at,
        ];
    }
}
