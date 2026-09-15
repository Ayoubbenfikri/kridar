<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One row = one platform setting the admin can change at runtime.
 *
 * Nothing in the app reads this model directly — everything goes
 * through App\Services\SettingService, which owns the defaults, the
 * casting and the cache. That keeps "what is a valid setting" in ONE
 * place instead of spread across every caller.
 */
class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];
}
