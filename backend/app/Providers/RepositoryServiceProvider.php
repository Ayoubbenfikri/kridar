<?php

namespace App\Providers;

use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Eloquent\EloquentPropertyRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Binds each repository interface (app/Repositories/Contracts) to its
 * Eloquent implementation (app/Repositories/Eloquent).
 *
 * Why this exists: Services depend on the interface, never on the
 * concrete Eloquent class. That means PropertyService, for example, can
 * be unit-tested with a fake repository instead of hitting a real
 * database, and swapping the data source later never touches the
 * Services or Controllers.
 *
 * Filled in one repository at a time as each feature phase needs it:
 *
 *   ReservationRepositoryInterface::class => EloquentReservationRepository::class, (Phase 8)
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        PropertyRepositoryInterface::class => EloquentPropertyRepository::class,
    ];

    public function register(): void
    {
        foreach ($this->bindings as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
    }
}
