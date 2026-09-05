<?php

namespace App\Repositories\Eloquent;

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
            ->latest()
            ->paginate($perPage);
    }
}
