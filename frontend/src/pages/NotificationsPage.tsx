import { useSearchParams } from 'react-router-dom'
import { BellOff, CheckCheck, TriangleAlert } from 'lucide-react'
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from '@/features/notifications/useNotifications'
import { Button, Card, EmptyState, Pagination, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'

/**
 * The current user's notifications, newest first, paginated. Reachable
 * only when logged in (router.tsx wraps it in ProtectedRoute).
 */
export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isError, isFetching } = useNotifications(page)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasUnread = data?.data.some((notification) => notification.read_at === null) ?? false

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
        {hasUnread && (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCheck className="size-4" />}
            isLoading={markAllAsRead.isPending}
            onClick={() => markAllAsRead.mutate()}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            Impossible de charger vos notifications.
          </Card>
        ) : !data ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<BellOff className="size-6" />}
            title="Aucune notification"
            description="Vous serez prévenu ici des confirmations, annulations et nouveaux avis."
          />
        ) : (
          <>
            <ul className={cn('space-y-3 transition-opacity', isFetching && 'opacity-60')}>
              {data.data.map((notification) => {
                const isUnread = notification.read_at === null
                return (
                  <li
                    key={notification.id}
                    className={cn(
                      'rounded-xl border p-4 transition',
                      isUnread ? 'border-brand-200 bg-brand-50/60' : 'border-gray-200 bg-white',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot: the status has to be visible without
                          relying on the background colour alone. */}
                      <span
                        aria-hidden
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          isUnread ? 'bg-brand-600' : 'bg-gray-300',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] text-gray-800">{notification.data.message}</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <time className="text-xs text-gray-400" dateTime={notification.created_at}>
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </time>
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => markAsRead.mutate(notification.id)}
                              disabled={markAsRead.isPending}
                              className="text-xs font-semibold text-brand-600 transition hover:text-brand-700 disabled:opacity-50"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </main>
  )
}
