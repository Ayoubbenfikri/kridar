export type PaymentStatusValue = 'pending' | 'paid' | 'failed'

/**
 * Mirrors backend App\Http\Resources\PaymentResource exactly.
 */
export interface Payment {
  id: number
  reservation_id: number
  amount: string
  currency: string
  provider: string
  provider_transaction_id: string | null
  status: PaymentStatusValue
  paid_at: string | null
  created_at: string
}
