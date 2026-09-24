<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\AdminActivityLog
 *
 * Read-only, admin-only (GET /admin/activity). It exposes the acting
 * admin's email, which is fine for this audience and nowhere else — the
 * same rule as UserResource.
 */
class AdminActivityLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,

            // Null when the acting admin's account was since deleted
            // (User uses SoftDeletes). The frontend says so rather than
            // showing a blank author.
            'admin' => $this->admin === null ? null : [
                'id' => $this->admin->id,
                'name' => $this->admin->name,
                'email' => $this->admin->email,
            ],

            // target_label is the name as it was at the time; target_type
            // and target_id let the UI build a link when the row still
            // exists. There is no relation to load — on purpose, so a
            // deleted target does not break the log.
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'target_label' => $this->target_label,

            'context' => $this->context,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at,
        ];
    }
}
