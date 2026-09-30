<?php

namespace App\Services;

use App\Enums\RoommateListingStatus;
use App\Exceptions\RoommateListingSuspendedException;
use App\Models\RoommateListing;
use App\Models\User;
use App\Repositories\Contracts\RoommateListingRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Same shape as PropertyService, minus the publication-fee machinery —
 * roommate posts are exempt from the fee (confirmed decision), so
 * create() has nothing to check or lock the owner row for. No slug
 * either: roommate posts are not linked to by a readable URL the way
 * property listings are, so there is nothing to keep stable.
 *
 * publish() does have one check — an admin suspension, same as
 * PropertyService::publish().
 */
class RoommateListingService
{
    public function __construct(
        private readonly RoommateListingRepositoryInterface $listings,
    ) {}

    /**
     * @param  array<string, mixed>  $filters  validated RoommateListingSearchRequest data
     */
    public function listPublished(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->listings->paginatePublished($filters, $perPage);
    }

    public function listForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $this->listings->paginateForUser($user->id, $perPage);
    }

    /**
     * @param  array<string, mixed>  $data  validated StoreRoommateListingRequest data
     */
    public function create(array $data, User $user): RoommateListing
    {
        $data['user_id'] = $user->id; // never trust a user_id from the frontend
        $data['currency'] = 'MAD';
        $data['status'] = RoommateListingStatus::Draft; // starts as a draft, same as a property

        return $this->listings->create($data)->load('images');
    }

    /**
     * @param  array<string, mixed>  $data  validated UpdateRoommateListingRequest data
     */
    public function update(RoommateListing $listing, array $data): RoommateListing
    {
        return $this->listings->update($listing, $data)->load('images');
    }

    public function delete(RoommateListing $listing): bool
    {
        return $this->listings->delete($listing);
    }

    public function publish(RoommateListing $listing): RoommateListing
    {
        // A suspension is an admin-only lock (added alongside admin
        // moderation) - the poster's own publish button can't lift it,
        // only AdminService::approveRoommateListing() can. Otherwise
        // suspending a post would have no real effect. Mirrors
        // PropertyService::publish() exactly.
        if ($listing->status === RoommateListingStatus::Suspended) {
            throw new RoommateListingSuspendedException(
                'This post was suspended by an administrator and can only be republished by one.'
            );
        }

        return $this->listings->update($listing, [
            'status' => RoommateListingStatus::Published,
            'published_at' => now(),
        ]);
    }

    public function unpublish(RoommateListing $listing): RoommateListing
    {
        return $this->listings->update($listing, [
            'status' => RoommateListingStatus::Draft,
            'published_at' => null,
        ]);
    }
}
