import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/features/notifications/useNotifications'

/**
 * Bell + unread dot, linking to /notifications - no dropdown panel, kept
 * simple on purpose. `showLabel` adds the text label for the navbar's
 * mobile panel, where an icon alone in a vertical list would be unclear.
 *
 * RTL (Phase 27): same treatment as MessagesLink — the dot is pinned to
 * the trailing corner with -end-0.5 so it mirrors with the layout.
 */
export default function NotificationBell({ showLabel = false }: { showLabel?: boolean }) {
  const { t } = useTranslation()
  const unreadCount = useUnreadCount(true)
  const hasUnread = unreadCount > 0

  return (
    <Link
      to="/notifications"
      aria-label={
        hasUnread ? t('nav.notificationsUnread', { n: unreadCount }) : t('nav.notifications')
      }
      className={
        showLabel
          ? 'flex items-center gap-3 text-[15px] font-medium text-gray-600 transition hover:text-gray-900'
          : 'relative flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900'
      }
    >
      <span className="relative flex">
        <Bell className={showLabel ? 'size-4.5 text-gray-400' : 'size-5'} aria-hidden />
        {hasUnread && (
          <span
            className={
              showLabel
                ? 'absolute -top-0.5 -end-0.5 size-2 rounded-full bg-accent'
                : 'absolute -top-0.5 -end-0.5 size-2 rounded-full bg-accent ring-2 ring-white'
            }
          />
        )}
      </span>
      {showLabel && (
        <span>
          {t('nav.notifications')}
          {hasUnread && <span className="ms-1 text-xs font-semibold text-accent">({unreadCount})</span>}
        </span>
      )}
    </Link>
  )
}
