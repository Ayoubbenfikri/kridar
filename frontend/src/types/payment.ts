export type PaymentStatusValue = 'pending' | 'paid' | 'failed' | 'refunded'

/** Mirrors backend App\Enums\PaymentType. */
export type PaymentTypeValue = 'reservation' | 'listing_publication'

/**
 * Mirrors backend App\Http\Resources\PaymentResource exactly.
 *
 * A payment is either for a reservation or for publishing a listing:
 * `type` says which, and exactly one of reservation_id / property_id is
 * filled — the other is null.
 */
export interface Payment {
  id: number
  type: PaymentTypeValue
  reservation_id: number | null
  property_id: number | null
  amount: string
  currency: string
  provider: string
  provider_transaction_id: string | null
  status: PaymentStatusValue
  paid_at: string | null
  created_at: string
}
