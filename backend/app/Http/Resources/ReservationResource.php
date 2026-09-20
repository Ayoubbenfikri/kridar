<?php

namespace App\Http\Resources;

use App\Enums\PaymentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Reservation
 */
class ReservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'guest' => new UserResource($this->whenLoaded('guest')),
            'rental_type' => $this->rental_type,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'unit_price' => $this->unit_price,

            // What the guest pays.
            'total_price' => $this->total_price,

            // How total_price splits, snapshotted when the reservation
            // was created. All three are 0 on a long-term reservation:
            // Kridar takes nothing from rent.
            'commission_rate' => $this->commission_rate,
            'commission_amount' => $this->commission_amount,
            'owner_amount' => $this->owner_amount,

            // Has this booking actually been paid?
            //
            // The list queries add it as a subquery column
            // (EloquentReservationRepository::paidPaymentExists), which
            // is one query for a whole page. On a single reservation
            // that was fetched without it, fall back to asking directly
            // — one extra query on one row is cheap, and returning a
            // wrong `false` would put a Pay button on a settled booking.
            'is_paid' => $this->is_paid !== null
                ? (bool) $this->is_paid
                : $this->payments()->where('status', PaymentStatus::Paid)->exists(),

            'guests_count' => $this->guests_count,
            'status' => $this->status,
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_at' => $this->cancelled_at,
            'created_at' => $this->created_at,
        ];
    }
}
