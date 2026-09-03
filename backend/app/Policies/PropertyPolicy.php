<?php

namespace App\Policies;

use App\Enums\PropertyStatus;
use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    /**
     * Anyone can view a published property. A draft/suspended one is only
     * visible to its owner or an admin — used on the show() endpoint.
     */
    public function view(?User $user, Property $property): bool
    {
        if ($property->status === PropertyStatus::Published) {
            return true;
        }

        return $user !== null && ($user->id === $property->owner_id || $user->isAdmin());
    }

    public function update(User $user, Property $property): bool
    {
        return $user->id === $property->owner_id || $user->isAdmin();
    }

    public function delete(User $user, Property $property): bool
    {
        return $user->id === $property->owner_id || $user->isAdmin();
    }
}
