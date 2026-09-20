<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * The single source of truth for Kridar's configurable numbers:
 *
 *   listing_publication_fee     what an owner pays once to publish a
 *                               long-term listing (default 20 MAD)
 *   short_term_commission_rate  Kridar's cut of a short-term booking,
 *                               in percent (default 10)
 *   mad_to_paypal_rate          how many MAD one unit of the PayPal
 *                               currency is worth (default 10.80 MAD
 *                               per EUR) — PayPal does not accept MAD,
 *                               so every amount is divided by this
 *                               right before the call
 *
 * Why a service and not config(): the admin changes these from the
 * dashboard at runtime, and a config file can only be changed by
 * editing code and redeploying.
 *
 * Why the defaults live HERE and not as seeded rows: a fresh database
 * (migrate:fresh) is then already correct before an admin has ever
 * opened the settings page, and nobody can break the app by deleting a
 * row. The table only ever holds values the admin actually changed.
 */
class SettingService
{
    public const LISTING_FEE = 'listing_publication_fee';

    public const COMMISSION_RATE = 'short_term_commission_rate';

    public const PAYPAL_RATE = 'mad_to_paypal_rate';

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
        self::PAYPAL_RATE => 10.80,
    ];

    private const CACHE_KEY = 'kridar.settings';

    /**
     * @return array<string, float>
     */
    public function all(): array
    {
        // Cache the RAW database rows only — never the finished array.
        //
        // This matters. The first version cached the merged result, and
        // adding mad_to_paypal_rate to DEFAULTS then blew up with
        // "Undefined array key": rememberForever still held the older
        // two-key array, so the closure never ran again and the new key
        // simply did not exist. Nothing short of clearing the
        // application cache could fix it — which is impossible to ask
        // of a production deployment.
        //
        // Merging on every read costs one foreach over three entries.
        // In exchange, a setting added tomorrow can never produce a
        // missing key: it just falls back to its default until an admin
        // sets it, whatever is sitting in the cache.
        $stored = Cache::rememberForever(self::CACHE_KEY, function (): array {
            return Setting::query()->pluck('value', 'key')->all();
        });

        $values = [];
        foreach (self::DEFAULTS as $key => $default) {
            $values[$key] = array_key_exists($key, $stored) ? (float) $stored[$key] : $default;
        }

        return $values;
    }

    public function listingFee(): float
    {
        return $this->all()[self::LISTING_FEE];
    }

    public function commissionRate(): float
    {
        return $this->all()[self::COMMISSION_RATE];
    }

    /** MAD per one unit of config('payments.paypal.currency'). */
    public function paypalRate(): float
    {
        return $this->all()[self::PAYPAL_RATE];
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
