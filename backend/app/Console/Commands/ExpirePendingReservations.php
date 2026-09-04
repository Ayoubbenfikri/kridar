<?php

namespace App\Console\Commands;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use Illuminate\Console\Command;

/**
 * Request-to-book model: a guest's request holds the dates as "pending"
 * until the owner confirms it. If the owner doesn't respond within 48h,
 * this frees the dates back up automatically instead of leaving them
 * blocked forever. Scheduled in routes/console.php; can also be run by
 * hand: php artisan reservations:expire-pending
 */
class ExpirePendingReservations extends Command
{
    protected $signature = 'reservations:expire-pending';

    protected $description = 'Cancel pending reservation requests the owner has not confirmed within 48 hours.';

    public function handle(): int
    {
        $count = Reservation::query()
            ->where('status', ReservationStatus::Pending)
            ->where('created_at', '<=', now()->subHours(48))
            ->update([
                'status' => ReservationStatus::Cancelled->value,
                'cancellation_reason' => 'Automatically cancelled: not confirmed by the owner within 48 hours.',
                'cancelled_at' => now(),
            ]);

        $this->info("Expired {$count} pending reservation(s).");

        return self::SUCCESS;
    }
}
