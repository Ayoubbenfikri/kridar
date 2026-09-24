<?php

namespace App\Services;

use App\Enums\AdminAction;
use App\Models\AdminActivityLog;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Writes the admin audit trail. One method, called from AdminService
 * right next to the change it records, so an action and its log entry
 * cannot drift apart.
 *
 * Deliberately NOT a model observer. An observer would fire on every
 * update to a User or Property from anywhere — an owner editing their own
 * listing, a scheduled command completing a reservation — and the log
 * would fill with events no admin caused. What belongs here is the small
 * set of things an admin chose to do.
 */
class AdminActivityLogger
{
    /**
     * @param  User  $admin  who performed the action
     * @param  Model|null  $target  what it was performed on, if there is one
     * @param  array<string, mixed>  $context  action-specific details
     */
    public function record(
        User $admin,
        AdminAction $action,
        ?Model $target = null,
        array $context = [],
    ): AdminActivityLog {
        return AdminActivityLog::create([
            'admin_id' => $admin->id,
            'action' => $action,
            'target_type' => $target === null ? null : class_basename($target),
            'target_id' => $target?->getKey(),
            'target_label' => $this->labelFor($target),
            'context' => $context === [] ? null : $context,

            // request() is always available here: every caller is inside
            // an HTTP request (the admin routes). In an artisan context
            // this would record the console's "127.0.0.1", which is
            // harmless — no console command writes to this log today.
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * The human name of the target, snapshotted so the row still reads
     * sensibly after the target is renamed or deleted.
     */
    private function labelFor(?Model $target): ?string
    {
        return match (true) {
            $target instanceof User => $target->name,
            $target instanceof Property => $target->title,
            default => null,
        };
    }
}
