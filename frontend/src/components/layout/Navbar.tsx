import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Building2,
  CalendarCheck,
  Heart,
  HeartHandshake,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import NotificationBell from '@/components/notifications/NotificationBell'
import MessagesLink from '@/components/messaging/MessagesLink'
import LanguageSwitcher from './LanguageSwitcher'
import { buttonClasses } from '@/components/ui'
import { cn } from '@/lib/cn'

/**
 * Links shown to everyone. `labelKey` rather than `label` (Phase 27):
 * these arrays are module constants, evaluated once at import time, so a
 * translated STRING here would be frozen in whatever language the app
 * started in and would never change when the language does. The key is
 * what is constant; the text is looked up during render.
 */
const PUBLIC_LINKS = [
  { to: '/', labelKey: 'nav.home', end: true, icon: Home },
  { to: '/properties', labelKey: 'nav.properties', end: false, icon: Building2 },
  { to: '/roommates', labelKey: 'nav.roommates', end: false, icon: Users },
]

/** Links that only make sense once logged in. */
const PRIVATE_LINKS = [
  { to: '/reservations', labelKey: 'nav.myReservations', icon: CalendarCheck, end: false },
  { to: '/favorites', labelKey: 'nav.favorites', icon: Heart, end: false },
  { to: '/owner', labelKey: 'nav.ownerSpace', icon: Briefcase, end: false },
]

/**
 * Site navigation. Desktop (`lg` and up) renders as a left sidebar - the
 * whole site now uses the same shell OwnerLayout/AdminLayout already
 * proved out, so there is one nav pattern instead of two. Below `lg`
 * there is no room for a full sidebar, so it splits in two instead of
 * collapsing into one hamburger:
 *   1. A slim top strip (logo + language + a "more" toggle) - this file.
 *   2. A fixed bottom tab bar for the primary destinations - MobileTabBar.
 * The "more" panel below only holds what the bottom tab bar has no room
 * for (Favoris, Mes réservations, Espace propriétaire, Admin, Support,
 * account actions) - Home/Properties/Roommates/Messages/Account live in
 * the tab bar, so they are deliberately NOT repeated here.
 *
 * NavLink handles the active state everywhere, so the highlight always
 * follows the real route, never a manual guess.
 *
 * RTL (Phase 27): flexbox + `gap` reverses on its own under dir="rtl".
 * The one thing that needed a logical utility is the account dropdown's
 * anchor (`end-0` instead of `right-0`), same as before.
 *
 * `isSidebarCollapsed`/`onToggleSidebar` are owned by AppLayout, not this
 * component: AppLayout also needs to know the state, to size its grid
 * column, so the state has to live above both of them.
 */
export default function Navbar({
  isSidebarCollapsed,
  onToggleSidebar,
}: {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
}) {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoadingUser, logout } = useAuth()
  const location = useLocation()

  const [isMorePanelOpen, setIsMorePanelOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Any navigation closes both menus - otherwise a panel stays open over
  // the page you just landed on.
  useEffect(() => {
    setIsMorePanelOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  // Close the account dropdown on an outside click or on Escape - the two
  // ways a user expects to dismiss a menu.
  useEffect(() => {
    if (!isUserMenuOpen) return

    function onPointerDown(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) setIsUserMenuOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsUserMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isUserMenuOpen])

  // The link is only rendered for an admin; the real gate is the backend
  // 'admin' middleware, not this check.
  const isAdmin = user?.role === 'admin'

  const initials = (user?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  // Same shape as sidebarLinkClass - kept as a second function (not a
  // shared one) only because the "more" panel and the sidebar are
  // visually two different lists, not because the styling differs.
  const panelLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <>
      {/* Desktop / tablet-landscape: left sidebar, full height. A real
          grid column now (sized by AppLayout), not a fixed overlay - see
          the note in AppLayout.tsx for why. Rendered only when NOT
          collapsed; the floating button further down takes its place. */}
      {!isSidebarCollapsed && (
        <aside className="hidden lg:sticky lg:top-0 lg:z-40 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:border-e lg:border-gray-200 lg:bg-white">
          <div className="flex items-center justify-between gap-2 px-4 py-5 ps-5">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900"
            >
              <img src="/logo-icon.png" alt="" aria-hidden="true" className="size-8 shrink-0" />
              <span className="truncate">Krihouse</span>
            </Link>
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={t('nav.collapseSidebar')}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <PanelLeftClose className="size-4.5" aria-hidden />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {PUBLIC_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={sidebarLinkClass}>
                <link.icon className="size-4.5 shrink-0 text-gray-400" aria-hidden />
                {t(link.labelKey)}
              </NavLink>
            ))}

            {!isLoadingUser && isAuthenticated && (
              <>
                <div className="my-2 border-t border-gray-100" />
                {PRIVATE_LINKS.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} className={sidebarLinkClass}>
                    <link.icon className="size-4.5 shrink-0 text-gray-400" aria-hidden />
                    {t(link.labelKey)}
                  </NavLink>
                ))}
                {/* Icon+label rows already built for this exact shape -
                    reused as-is rather than re-implemented here. */}
                <MessagesLink showLabel />
                <NotificationBell showLabel />
                {isAdmin && (
                  <NavLink to="/admin" className={sidebarLinkClass}>
                    <ShieldCheck className="size-4.5 shrink-0 text-gray-400" aria-hidden />
                    {t('nav.admin')}
                  </NavLink>
                )}
              </>
            )}

            <div className="my-2 border-t border-gray-100" />
            {/* Shown whether or not you're logged in - unlike the links
                above, supporting the project needs no account. */}
            <NavLink to="/support" className={sidebarLinkClass}>
              <HeartHandshake className="size-4.5 shrink-0 text-gray-400" aria-hidden />
              {t('nav.support')}
            </NavLink>
          </nav>

          <div className="space-y-3 border-t border-gray-100 p-3">
            <LanguageSwitcher />

            {isLoadingUser ? null : isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 transition hover:border-gray-300 hover:shadow-sm"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {initials || <User className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-start text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </button>

                {/* Opens UPWARD (bottom-full) rather than downward: this
                    button sits at the very bottom of the sidebar, so a
                    menu dropping below it would run off the viewport. */}
                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute bottom-full start-0 z-50 mb-2 w-full min-w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="truncate text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/account"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      >
                        <User className="size-4 text-gray-400" aria-hidden /> {t('nav.account')}
                      </Link>
                      <Link
                        to="/account/settings"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      >
                        <Settings className="size-4 text-gray-400" aria-hidden /> {t('nav.settings')}
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 p-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => logout.mutate()}
                        disabled={logout.isPending}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <LogOut className="size-4" aria-hidden />
                        {logout.isPending ? t('nav.loggingOut') : t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className={buttonClasses({ variant: 'secondary', fullWidth: true })}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className={buttonClasses({ fullWidth: true })}>
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Floating "show sidebar" button - only shown once the sidebar
          above is collapsed, so there is always a way to bring it back. */}
      {isSidebarCollapsed && (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={t('nav.expandSidebar')}
          className="fixed start-4 top-4 z-40 hidden size-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 lg:flex"
        >
          <PanelLeftOpen className="size-5" aria-hidden />
        </button>
      )}

      {/* Mobile / tablet-portrait: a slim top strip, not a full navbar -
          primary navigation lives in the fixed bottom tab bar instead
          (MobileTabBar.tsx, rendered by AppLayout). */}
      <header className="border-b border-gray-200 bg-white lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900">
            <img src="/logo-icon.png" alt="" aria-hidden="true" className="size-7" />
            Krihouse
          </Link>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            <button
              type="button"
              onClick={() => setIsMorePanelOpen((open) => !open)}
              aria-label={isMorePanelOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={isMorePanelOpen}
              className="flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {isMorePanelOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* overflow-hidden + max-height keeps the open/close smooth
            without needing an animation library. */}
        <div
          className={cn(
            'overflow-hidden border-gray-100 transition-all duration-200 ease-in-out',
            isMorePanelOpen ? 'max-h-[28rem] border-t opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <nav className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {!isLoadingUser && isAuthenticated && (
              <>
                {PRIVATE_LINKS.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} className={panelLinkClass}>
                    <link.icon className="size-4.5 text-gray-400" aria-hidden />
                    {t(link.labelKey)}
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink to="/admin" className={panelLinkClass}>
                    <ShieldCheck className="size-4.5 text-gray-400" aria-hidden /> {t('nav.admin')}
                  </NavLink>
                )}
              </>
            )}

            <NavLink to="/support" className={panelLinkClass}>
              <HeartHandshake className="size-4.5 text-gray-400" aria-hidden /> {t('nav.support')}
            </NavLink>

            {isLoadingUser ? null : isAuthenticated ? (
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="size-4.5" aria-hidden />
                {logout.isPending ? t('nav.loggingOut') : t('nav.logout')}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <Link to="/login" className={buttonClasses({ variant: 'secondary', fullWidth: true })}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className={buttonClasses({ fullWidth: true })}>
                  {t('nav.register')}
                </Link>
              </div>
            )}

            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 px-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                {t('language.label')}
              </p>
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>
    </>
  )
}
