import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '@/components/ui'

/**
 * Shows the outcome of a payment the user has just come back from.
 *
 * Paying leaves the app entirely: the browser goes to PayPal, and the
 * backend's GET /payments/{id}/return sends it back here with
 * ?payment=success|failed|cancelled (see PaymentController).
 * Nothing survives that round trip, so the result HAS to travel in the
 * URL — there is no React state left to read it from.
 *
 * The parameter is stripped afterwards so a refresh, or a click on
 * "back", does not replay the toast on a page that is now just a page.
 */
type PaymentResult = 'success' | 'failed' | 'cancelled'

const MESSAGES: Record<PaymentResult, { tone: 'success' | 'error' | 'info'; message: string }> = {
  success: {
    tone: 'success',
    message: 'Paiement confirmé.',
  },
  failed: {
    tone: 'error',
    message: "Le paiement n'a pas abouti. Rien n'a été débité.",
  },
  cancelled: {
    tone: 'info',
    message: "Paiement annulé. Rien n'a été débité.",
  },
}

export function usePaymentResult() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()

  const result = searchParams.get('payment')

  useEffect(() => {
    if (result === null) return

    const entry = MESSAGES[result as PaymentResult]
    if (entry) {
      showToast(entry.tone, entry.message)
    }

    // Clearing the param re-runs this effect once, and `result` is then
    // null, so it stops. replace: true keeps it out of history.
    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    setSearchParams(next, { replace: true })
  }, [result, searchParams, setSearchParams, showToast])
}
