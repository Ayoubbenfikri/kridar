<?php

namespace App\Http\Resources;

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

            // Phase 22 (pricing) — the split of total_price, snapshotted
            // when the reservation was created. All three are 0 on a
            // long-term reservation: Kridar takes nothing from rent.
            'commission_rate' => $this->commission_rate,
            'commission_amount' => $this->commission_amount,
            'owner_amount' => $this->owner_amount,

            'guests_count' => $this->guests_count,
            'status' => $this->status,
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_at' => $this->cancelled_at,
            'created_at' => $this->created_at,
        ];
    }
}
