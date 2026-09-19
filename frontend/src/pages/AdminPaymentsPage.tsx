import { useSearchParams } from 'react-router-dom'
import { TriangleAlert, Wallet } from 'lucide-react'
import { useAdminPayments } from '@/features/admin/useAdmin'
import { formatMad } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Card, EmptyState, Pagination, Skeleton } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import type { AdminPayment } from '@/types/admin'
import type { PaymentStatusValue, PaymentTypeValue } from '@/types/payment'
import { cn } from '@/lib/cn'

const STATUS_LABELS: Record<PaymentStatusValue, string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
  refunded: 'Remboursé',
}

const STATUS_TONES: Record<PaymentStatusValue, BadgeTone> = {
  pending: 'amber',
  paid: 'green',
  failed: 'red',
  refunded: 'slate',
}

const TYPE_LABELS: Record<PaymentTypeValue, string> = {
  listing_publication: 'Publication',
  reservation: 'Réservation',
}

const FILTERS: Array<{ value: PaymentTypeValue | 'all'; label: string }> = [
  { value: 'all', label: 'Tout' },
  { value: 'listing_publication', label: 'Publications longue durée' },
  { value: 'reservation', label: 'Réservations courte durée' },
]

/**
 * Phase 22 (pricing) — what Kridar actually earned on one transaction.
 *
 * The two types are NOT read the same way, and this is the trap the
 * page exists to avoid:
 *   - publication : `amount` is the fee, all of it is Kridar's.
 *   - reservation : `amount` is what the GUEST paid, almost all of
 *                   which belongs to the owner. Kridar's share is the
 *                   commission snapshotted on the reservation.
 */
function kridarShare(payment: AdminPayment): string {
  if (payment.type === 'listing_publication') {
    return payment.amount
  }
  return payment.reservation?.commission_amount ?? '0'
}

/** What the payment was for, in one line. */
function subject(payment: AdminPayment): string {
  if (payment.type === 'listing_publication') {
    return payment.property?.title ?? `Propriété #${payment.property_id ?? '?'}`
  }
  return `Réservation #${payment.reservation_id ?? '?'}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * /admin/payments - every transaction, both revenue streams, newest
 * first. The ?type= filter is kept in the URL so the links from the
 * dashboard revenue cards land on the right filter and the page can be
 * shared or reloaded.
 */
export default function AdminPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const rawType = searchParams.get('type')
  const type: PaymentTypeValue | undefined =
    rawType === 'listing_publication' || rawType === 'reservation' ? rawType : undefined

  const { data, isError, error, isFetching } = useAdminPayments(page, type)

  function setFilter(value: PaymentTypeValue | 'all') {
    // Changing the filter resets to page 1 — page 3 of "everything" is
    // rarely page 3 of a narrower list.
    setSearchParams(value === 'all' ? {} : { type: value })
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    if (nextPage === 1) {
      next.delete('page')
    } else {
      next.set('page', String(nextPage))
    }
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Transactions</h1>
      <p className="mt-1 text-sm text-gray-500">
        Frais de publication et commissions sur réservations
      </p>

      <div className="mt-6 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {FILTERS.map((filter) => {
          const isActive = (filter.value === 'all' && type === undefined) || filter.value === type
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setFilter(filter.value)}
              aria-pressed={isActive}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {getErrorMessage(error)}
          </Card>
        ) : !data ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-6" />}
            title="Aucune transaction"
            description="Les frais de publication et les commissions apparaîtront ici dès le premier paiement."
          />
        ) : (
          <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
            <Card className="hidden overflow-hidden p-0 lg:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-32" />
                  <col />
                  <col className="w-32" />
                  <col className="w-32" />
                  <col className="w-28" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    {['Date', 'Type', 'Objet', 'Montant', 'Part Kridar', 'Statut'].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={payment.type === 'listing_publication' ? 'slate' : 'green'}>
                          {TYPE_LABELS[payment.type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate text-sm font-medium text-gray-900" title={subject(payment)}>
                          {subject(payment)}
                        </p>
                        {payment.user && (
                          <p className="truncate text-xs text-gray-500">{payment.user.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        {formatMad(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap text-brand-700">
                        {formatMad(kridarShare(payment))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONES[payment.status]}>
                          {STATUS_LABELS[payment.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="space-y-3 lg:hidden">
              {data.data.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{subject(payment)}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDate(payment.created_at)}
                        {payment.user ? ` · ${payment.user.name}` : ''}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONES[payment.status]}>{STATUS_LABELS[payment.status]}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
                    <Badge tone={payment.type === 'listing_publication' ? 'slate' : 'green'}>
                      {TYPE_LABELS[payment.type]}
                    </Badge>
                    <span className="text-gray-500">
                      Montant {formatMad(payment.amount)} ·{' '}
                      <strong className="text-brand-700">
                        Kridar {formatMad(kridarShare(payment))}
                      </strong>
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </div>
        )}
      </div>
    </>
  )
}
