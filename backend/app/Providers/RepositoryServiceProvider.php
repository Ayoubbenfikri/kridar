<?php

namespace App\Providers;

use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Repositories\Contracts\ReviewRepositoryInterface;
use App\Repositories\Eloquent\EloquentPaymentRepository;
use App\Repositories\Eloquent\EloquentPropertyRepository;
use App\Repositories\Eloquent\EloquentReservationRepository;
use App\Repositories\Eloquent\EloquentReviewRepository;
use App\Services\Gateways\FakeCmiGateway;
use App\Services\Gateways\PaymentGatewayInterface;
use Illuminate\Support\ServiceProvider;

/**
 * Binds each repository interface (app/Repositories/Contracts) to its
 * Eloquent implementation (app/Repositories/Eloquent), plus the payment
 * gateway interface (app/Services/Gateways) to whichever gateway class
 * is currently active.
 *
 * Why this exists: Services depend on the interface, never on the
 * concrete Eloquent class. That means PropertyService, for example, can
 * be unit-tested with a fake repository instead of hitting a real
 * database — and swapping the data source later never touches the
 * Services or Controllers. Same idea for PaymentGatewayInterface: when
 * real CMI credentials exist, only the line below changes (FakeCmiGateway
 * -> CmiGateway) — PaymentService, PaymentController and routes stay
 * untouched.
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        PropertyRepositoryInterface::class => EloquentPropertyRepository::class,
        ReservationRepositoryInterface::class => EloquentReservationRepository::class,
        PaymentRepositoryInterface::class => EloquentPaymentRepository::class,
        ReviewRepositoryInterface::class => EloquentReviewRepository::class,
        PaymentGatewayInterface::class => FakeCmiGateway::class, // TODO: swap for CmiGateway::class once real CMI credentials exist
    ];

    public function register(): void
    {
        foreach ($this->bindings as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
    }
}
