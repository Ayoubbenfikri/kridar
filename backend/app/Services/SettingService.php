<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * The single source of truth for Kridar's two configurable prices
 * (Phase 22 — pricing):
 *
 *   listing_publication_fee     — what an owner pays once to publish a
 *                                 long-term listing (default 20 MAD)
 *   short_term_commission_rate  — Kridar's cut of a short-term booking,
 *                                 in percent (default 10)
 *
 * Why a service and not config(): the admin changes these from the
 * dashboard at runtime, and a config file can only be changed by
 * editing code and redeploying.
 *
 * Why the defaults live HERE and not as seeded rows: a fresh database
 * (migrate:fresh) is then already correct before an admin has ever
 * opened the settings page, and nobody can break the app by deleting a
 * row. The table only ever holds values the admin actually changed.
 *
 * The values are read on nearly every booking and every property page,
 * so they are cached; update() is the only thing that ever invalidates
 * that cache.
 */
class SettingService
{
    public const LISTING_FEE = 'listing_publication_fee';

    public const COMMISSION_RATE = 'short_term_commission_rate';

    /**
     * Every setting the app knows about, with its fallback value. A key
     * that is not in this list is never read and never written — the
     * frontend cannot invent a setting.
     *
     * @var array<string, float>
     */
    private const DEFAULTS = [
        self::LISTING_FEE => 20.00,
        self::COMMISSION_RATE => 10.00,
    ];

    private const CACHE_KEY = 'kridar.settings';

    /**
     * @return array<string, float>
     */
    public function all(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function (): array {
            $stored = Setting::query()->pluck('value', 'key');

            $values = [];
            foreach (self::DEFAULTS as $key => $default) {
                $values[$key] = isset($stored[$key]) ? (float) $stored[$key] : $default;
            }

            return $values;
        });
    }

    public function listingFee(): float
    {
        return $this->all()[self::LISTING_FEE];
    }

    public function commissionRate(): float
    {
        return $this->all()[self::COMMISSION_RATE];
    }

    /**
     * @param  array<string, mixed>  $values  validated UpdateSettingsRequest data
     * @return array<string, float> the settings as they now stand
     */
    public function update(array $values): array
    {
        foreach ($values as $key => $value) {
            // Ignore anything we don't recognise rather than storing it:
            // the request class already validates, this is the second
            // lock (project rule: never trust incoming values).
            if (! array_key_exists($key, self::DEFAULTS)) {
                continue;
            }

            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value],
            );
        }

        Cache::forget(self::CACHE_KEY);

        return $this->all();
    }
}
