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

            // 'reservation' or 'listing_publication'. Exactly one of the
            // two ids below is set, decided by this.
            'type' => $this->type,
            'reservation_id' => $this->reservation_id,
            'property_id' => $this->property_id,

            // Always MAD — Kridar's own figure, and what the revenue
            // queries sum.
            'amount' => $this->amount,
            'currency' => $this->currency,

            // What the gateway actually charged, when it could not take
            // MAD. Null on a payment that never needed converting.
            'converted_amount' => $this->converted_amount,
            'converted_currency' => $this->converted_currency,

            'provider' => $this->provider,
            'provider_transaction_id' => $this->provider_transaction_id,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'created_at' => $this->created_at,

            // The three blocks below only appear where the query eager
            // loaded them (AdminService::listPayments). Everywhere else
            // the keys are simply absent, so no existing caller changes.
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),

            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'title' => $this->property->title,
            ]),

            // On a reservation payment, `amount` is what the GUEST paid -
            // Kridar's share is commission_amount, which lives on the
            // reservation. The admin table needs both to be honest.
            'reservation' => $this->whenLoaded('reservation', fn () => [
                'id' => $this->reservation->id,
                'total_price' => $this->reservation->total_price,
                'commission_rate' => $this->reservation->commission_rate,
                'commission_amount' => $this->reservation->commission_amount,
                'owner_amount' => $this->reservation->owner_amount,
            ]),
        ];
    }
}
