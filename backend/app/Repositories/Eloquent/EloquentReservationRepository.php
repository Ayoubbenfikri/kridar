<?php

namespace App\Repositories\Eloquent;

use App\Enums\PaymentStatus;
use App\Models\Reservation;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentReservationRepository implements ReservationRepositoryInterface
{
    public function create(array $attributes): Reservation
    {
        return Reservation::create($attributes);
    }

    public function update(Reservation $reservation, array $attributes): Reservation
    {
        $reservation->update($attributes);

        return $reservation->fresh();
    }

    public function paginateForGuest(int $guestId, int $perPage = 15): LengthAwarePaginator
    {
        return Reservation::query()
            ->where('guest_id', $guestId)
            ->with('property:id,title,slug,city,price_per_night,price_per_month')
            ->withExists($this->paidPaymentExists())
            ->latest()
            ->paginate($perPage);
    }

    public function paginateForOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return Reservation::query()
            ->whereHas('property', fn ($query) => $query->where('owner_id', $ownerId))
            ->with([
                'property:id,title,slug,city,price_per_night,price_per_month',
                'guest:id,name',
            ])
            ->withExists($this->paidPaymentExists())
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Adds a boolean `is_paid` column to the query: does this
     * reservation have at least one payment in the Paid state?
     *
     * One subquery for the whole page, not one query per row. Before
     * this existed the frontend tracked "just paid" in React state
     * only, so refreshing the page brought the Pay button back on a
     * reservation that was already settled — and after a redirect to a
     * payment provider, that state is gone by definition.
     *
     * @return array<string, \Closure>
     */
    private function paidPaymentExists(): array
    {
        return [
            'payments as is_paid' => fn ($query) => $query->where('status', PaymentStatus::Paid),
        ];
    }
}
