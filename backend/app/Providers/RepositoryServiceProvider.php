<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Binds each repository interface (app/Repositories/Contracts) to its
 * Eloquent implementation (app/Repositories/Eloquent).
 *
 * Why this exists: Services depend on the interface, never on the
 * concrete Eloquent class. That means AvailabilityService, for example,
 * can be unit-tested with a fake repository instead of hitting a real
 * database — and swapping the data source later never touches the
 * Services or Controllers.
 *
 * Phase 3 (migrations, models, factories, seeders) starts filling this
 * array in, one repository at a time:
 *
 *   PropertyRepositoryInterface::class => EloquentPropertyRepository::class,
 *   ReservationRepositoryInterface::class => EloquentReservationRepository::class,
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        //
    ];

    public function register(): void
    {
        foreach ($this->bindings as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
    }
}
