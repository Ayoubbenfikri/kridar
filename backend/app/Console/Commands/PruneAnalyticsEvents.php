<?php

namespace App\Console\Commands;

use App\Models\AnalyticsEvent;
use Illuminate\Console\Command;

/**
 * Phase A2 - analytics rows are kept 12 months, then deleted.
 *
 * Part of the privacy promise (claude/kridar-analytics-plan.md): even
 * anonymous data is not kept forever. Scheduled daily in
 * routes/console.php.
 */
class PruneAnalyticsEvents extends Command
{
    protected $signature = 'analytics:prune {--months=12 : Keep this many months of events}';

    protected $description = 'Delete analytics events older than 12 months.';

    /**
     * Deletes in small batches: one huge DELETE on a big table would lock
     * it for a long time, and the site writes to it on every page view.
     */
    private const BATCH = 5000;

    public function handle(): int
    {
        $months = max(1, (int) $this->option('months'));
        $cutoff = now()->subMonths($months);

        $total = 0;

        do {
            $deleted = AnalyticsEvent::query()
                ->where('created_at', '<', $cutoff)
                ->limit(self::BATCH)
                ->delete();

            $total += $deleted;
        } while ($deleted > 0);

        $this->info("Deleted {$total} analytics event(s) older than {$cutoff->toDateString()}.");

        return self::SUCCESS;
    }
}
