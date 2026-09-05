<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentNotificationRepository implements NotificationRepositoryInterface
{
    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->forUser($userId)
            ->latest()
            ->paginate($perPage);
    }

    public function markAsRead(string $notificationId, int $userId): bool
    {
        $notification = $this->forUser($userId)
            ->where('id', $notificationId)
            ->first();

        if ($notification === null) {
            return false;
        }

        // DatabaseNotification::markAsRead() already no-ops if it's
        // already read, no need to check read_at ourselves first.
        $notification->markAsRead();

        return true;
    }

    public function markAllAsRead(int $userId): int
    {
        return $this->forUser($userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Every notifiable in this app is a User (see App\Models\User's
     * Notifiable trait) - there's no other notifiable model, so it's
     * safe to hard-code the morph type here instead of accepting it as
     * a parameter nobody would ever pass differently.
     */
    private function forUser(int $userId): Builder
    {
        return DatabaseNotification::query()
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $userId);
    }
}
