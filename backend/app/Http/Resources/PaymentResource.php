<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            // Phase 22 (pricing): 'reservation' or 'listing_publication'.
            // Exactly one of the two ids below is set, decided by this.
            'type' => $this->type,
            'reservation_id' => $this->reservation_id,
            'property_id' => $this->property_id,

            'amount' => $this->amount,
            'currency' => $this->currency,
            'provider' => $this->provider,
            'provider_transaction_id' => $this->provider_transaction_id,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'created_at' => $this->created_at,
        ];
    }
}
