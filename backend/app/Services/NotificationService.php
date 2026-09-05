<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notifications,
    ) {}

    public function listForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $this->notifications->paginateForUser($user->id, $perPage);
    }

    /**
     * 404s if this notification doesn't exist OR doesn't belong to this
     * user - same response either way, so a user can't tell the
     * difference between "wrong id" and "someone else's notification".
     */
    public function markAsRead(User $user, string $notificationId): void
    {
        if (! $this->notifications->markAsRead($notificationId, $user->id)) {
            abort(404, 'Notification not found.');
        }
    }

    public function markAllAsRead(User $user): void
    {
        $this->notifications->markAllAsRead($user->id);
    }
}
