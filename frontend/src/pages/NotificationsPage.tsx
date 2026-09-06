import { useSearchParams } from 'react-router-dom'
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from '@/features/notifications/useNotifications'

/**
 * The current user's notifications, newest first, paginated. Reachable
 * only when logged in (see router.tsx, wrapped in ProtectedRoute).
 */
export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isLoading, isError, isFetching } = useNotifications(page)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  const hasUnread = data?.data.some((notification) => notification.read_at === null) ?? false

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-700">Notifications</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="text-sm text-brand-600 transition hover:underline disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {isLoading && <p className="text-gray-500">Chargement...</p>}

      {isError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          Impossible de charger vos notifications.
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="text-gray-500">Vous n'avez pas encore de notification.</p>
      )}

      {data && data.data.length > 0 && (
        <>
          <ul className={`space-y-3 ${isFetching ? 'opacity-60' : ''}`}>
            {data.data.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-lg border px-4 py-3 ${
                  notification.read_at ? 'border-gray-200 bg-white' : 'border-brand-200 bg-brand-50'
                }`}
              >
                <p className="text-sm text-gray-800">{notification.data.message}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString('fr-FR')}
                  </span>
                  {!notification.read_at && (
                    <button
                      type="button"
                      onClick={() => markAsRead.mutate(notification.id)}
                      disabled={markAsRead.isPending}
                      className="text-xs text-brand-600 transition hover:underline disabled:opacity-50"
                    >
                      Marquer comme lu
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500">
              Page {data.meta.current_page} / {data.meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= data.meta.last_page}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </main>
  )
}
