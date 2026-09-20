<?php

namespace App\Providers;

use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Repositories\Contracts\FavoriteRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Repositories\Contracts\ReviewRepositoryInterface;
use App\Repositories\Eloquent\EloquentConversationRepository;
use App\Repositories\Eloquent\EloquentFavoriteRepository;
use App\Repositories\Eloquent\EloquentNotificationRepository;
use App\Repositories\Eloquent\EloquentPaymentRepository;
use App\Repositories\Eloquent\EloquentPropertyRepository;
use App\Repositories\Eloquent\EloquentReservationRepository;
use App\Repositories\Eloquent\EloquentReviewRepository;
use App\Services\Gateways\FakeCmiGateway;
use App\Services\Gateways\PaymentGatewayInterface;
use App\Services\Gateways\PaypalGateway;
use Illuminate\Support\ServiceProvider;

/**
 * Binds each repository interface (app/Repositories/Contracts) to its
 * Eloquent implementation (app/Repositories/Eloquent), plus the payment
 * gateway interface (app/Services/Gateways) to whichever gateway the
 * configuration selects.
 *
 * Why this exists: Services depend on the interface, never on the
 * concrete Eloquent class. That means PropertyService, for example, can
 * be unit-tested with a fake repository instead of hitting a real
 * database — and swapping the data source later never touches the
 * Services or Controllers.
 *
 * Same idea for PaymentGatewayInterface, and it is now doing real work:
 * PAYMENT_GATEWAY=paypal in .env switches every payment in the app from
 * the offline fake to real PayPal calls, and PaymentService,
 * PaymentController and the routes do not change a line.
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
        FavoriteRepositoryInterface::class => EloquentFavoriteRepository::class,
        NotificationRepositoryInterface::class => EloquentNotificationRepository::class,
        ConversationRepositoryInterface::class => EloquentConversationRepository::class,
    ];

    /**
     * Which gateway class each config('payments.gateway') value means.
     *
     * @var array<string, class-string<PaymentGatewayInterface>>
     */
    private const GATEWAYS = [
        'fake' => FakeCmiGateway::class,
        'paypal' => PaypalGateway::class,
    ];

    public function register(): void
    {
        foreach ($this->bindings as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }

        $this->app->bind(PaymentGatewayInterface::class, function () {
            $name = (string) config('payments.gateway', 'fake');

            // An unknown value falls back to the fake gateway rather
            // than crashing the whole app on boot: a typo in .env should
            // not take the site down, and the fake one is always safe.
            return $this->app->make(self::GATEWAYS[$name] ?? FakeCmiGateway::class);
        });
    }
}
