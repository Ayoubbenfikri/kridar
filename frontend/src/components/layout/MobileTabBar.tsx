import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Home, MessageSquare, User, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useMessagesUnreadCount } from '@/features/messaging/useMessaging'
import { cn } from '@/lib/cn'

/**
 * Fixed bottom tab bar, mobile/tablet only (`lg:hidden` - matches
 * Navbar's slim top strip, which takes over from `lg` up). Same shape as
 * a typical mobile app tab bar: five destinations, icon above label,
 * active tab highlighted.
 *
 * Deliberately only five items, all top-level:
 *   - Home / Properties / Roommates - public browsing, same for everyone.
 *   - Messages - protected; tapping it while logged out hits the existing
 *     ProtectedRoute redirect to /login, so there is no special case here.
 *   - Account - the account "home" (AccountPage) once logged in, which
 *     already surfaces Favoris/Réservations/Notifications as its own
 *     stat cards, so those don't need their own tab too. Logged out, this
 *     becomes the login entry point, labelled "Connexion" - same pattern
 *     as the reference screenshot.
 * Anything not on this list (Espace propriétaire, Admin, Support,
 * language, logout) lives in the "more" panel behind Navbar's mobile
 * hamburger instead.
 */
export default function MobileTabBar() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoadingUser } = useAuth()
  const unreadMessages = useMessagesUnreadCount(isAuthenticated)
  const { pathname } = useLocation()

  const initials = (user?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition',
      isActive ? 'text-brand-600' : 'text-gray-500',
    )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <NavLink to="/" end className={tabClass}>
        <Home className="size-5.5" aria-hidden />
        {t('nav.home')}
      </NavLink>

      {/* /buy (properties for sale) is the same list as /properties with
          the other mode on — the switch is inside the page — so this tab
          stays highlighted on both. */}
      <NavLink
        to="/properties"
        className={({ isActive }) => tabClass({ isActive: isActive || pathname.startsWith('/buy') })}
      >
        <Building2 className="size-5.5" aria-hidden />
        {t('nav.properties')}
      </NavLink>

      <NavLink to="/roommates" className={tabClass}>
        <Users className="size-5.5" aria-hidden />
        {t('nav.roommates')}
      </NavLink>

      <NavLink to="/messages" className={tabClass}>
        <span className="relative flex">
          <MessageSquare className="size-5.5" aria-hidden />
          {unreadMessages > 0 && (
            <span className="absolute -top-0.5 -end-1 size-2 rounded-full bg-accent ring-2 ring-white" />
          )}
        </span>
        {t('nav.messages')}
      </NavLink>

      <NavLink to={isLoadingUser || !isAuthenticated ? '/login' : '/account'} className={tabClass}>
        {isAuthenticated && initials ? (
          <span className="flex size-5.5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
            {initials}
          </span>
        ) : (
          <User className="size-5.5" aria-hidden />
        )}
        {isAuthenticated ? t('nav.account') : t('nav.login')}
      </NavLink>
    </nav>
  )
}
