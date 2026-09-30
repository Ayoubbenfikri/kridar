<?php

namespace App\Policies;

use App\Enums\RoommateListingStatus;
use App\Models\RoommateListing;
use App\Models\User;

/**
 * Same shape as PropertyPolicy: published is public, anything else
 * (draft/archived) is only visible to its poster or an admin.
 */
class RoommateListingPolicy
{
    public function view(?User $user, RoommateListing $listing): bool
    {
        if ($listing->status === RoommateListingStatus::Published) {
            return true;
        }

        return $user !== null && ($user->id === $listing->user_id || $user->isAdmin());
    }

    public function update(User $user, RoommateListing $listing): bool
    {
        return $user->id === $listing->user_id || $user->isAdmin();
    }

    public function delete(User $user, RoommateListing $listing): bool
    {
        return $user->id === $listing->user_id || $user->isAdmin();
    }
}
