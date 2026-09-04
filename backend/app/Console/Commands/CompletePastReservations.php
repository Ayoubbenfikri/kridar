<?php

namespace App\Console\Commands;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use Illuminate\Console\Command;

/**
 * A confirmed stay whose end_date has already passed is over — flip it
 * to "completed" so it shows correctly as a past stay and becomes
 * eligible for a review (Phase 9). Scheduled in routes/console.php; can
 * also be run by hand: php artisan reservations:complete-past
 */
class CompletePastReservations extends Command
{
    protected $signature = 'reservations:complete-past';

    protected $description = 'Flip confirmed reservations whose end_date has passed to completed.';

    public function handle(): int
    {
        $count = Reservation::query()
            ->where('status', ReservationStatus::Confirmed)
            ->where('end_date', '<', now()->toDateString())
            ->update(['status' => ReservationStatus::Completed->value]);

        $this->info("Completed {$count} past reservation(s).");

        return self::SUCCESS;
    }
}
