import { Link } from 'react-router-dom'
import { useUnreadCount } from '@/features/notifications/useNotifications'

/**
 * Bell icon + unread badge in the Navbar, linking to the dedicated
 * /notifications page - no dropdown panel, kept simple on purpose.
 */
export default function NotificationBell() {
  const unreadCount = useUnreadCount(true)

  return (
    <Link
      to="/notifications"
      className="relative flex items-center text-gray-600 hover:text-brand-700"
      aria-label="Notifications"
    >
      <span className="text-lg">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
