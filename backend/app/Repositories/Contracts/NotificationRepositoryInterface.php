<?php

namespace App\Repositories\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface
{
    /**
     * This user's notifications, most recent first.
     */
    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    /**
     * @return bool  false if no notification with this id belongs to this user
     */
    public function markAsRead(string $notificationId, int $userId): bool;

    /**
     * @return int  how many were marked (0 if there were none unread)
     */
    public function markAllAsRead(int $userId): int;
}
