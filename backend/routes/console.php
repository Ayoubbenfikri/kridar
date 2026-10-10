<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Phase 8: keep reservation statuses honest without anyone needing to
// remember to run these by hand.
Schedule::command('reservations:expire-pending')->everyFifteenMinutes();
Schedule::command('reservations:complete-past')->daily();

// Phase A2 - analytics rows older than 12 months are deleted.
Schedule::command('analytics:prune')->daily();
