<?php

namespace App\Models;

use App\Enums\AdminAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One recorded admin action. Written only by AdminActivityLogger and
 * never updated — see the migration for why.
 *
 * @property AdminAction $action
 * @property array<string, mixed>|null $context
 */
class AdminActivityLog extends Model
{
    protected $fillable = [
        'admin_id',
        'action',
        'target_type',
        'target_id',
        'target_label',
        'context',
        'ip_address',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'action' => AdminAction::class,
            'context' => 'array',
        ];
    }

    /**
     * Who did it.
     *
     * User uses SoftDeletes, so this comes back null for an admin whose
     * account was deleted. admin_id is still on the row, and
     * AdminActivityLogResource says "compte supprimé" rather than
     * pretending the action had no author.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
