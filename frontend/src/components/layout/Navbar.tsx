import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Building2,
  CalendarCheck,
  Heart,
  KeyRound,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import NotificationBell from '@/components/notifications/NotificationBell'
import { buttonClasses } from '@/components/ui'
import { cn } from '@/lib/cn'

/** Links shown to everyone. */
const PUBLIC_LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/properties', label: 'Propriétés', end: false },
]

/** Links that only make sense once logged in. */
const PRIVATE_LINKS = [
  { to: '/reservations', label: 'Mes réservations', icon: CalendarCheck },
  { to: '/owner', label: 'Espace propriétaire', icon: Building2 },
]

/**
 * Sticky navbar. Three responsibilities worth knowing about:
 *
 * 1. It stays translucent and borderless at the top of the page, and
 *    grows a hairline border + shadow once you scroll - that is what
 *    keeps content from appearing to slide "into" it.
 * 2. NavLink handles the active state, so the underline indicator and
 *    aria-current always follow the real route, never a manual guess.
 * 3. From `md` up the links sit inline; below that they collapse into a
 *    hamburger panel (CSS max-height transition, no animation library).
 */
export default function Navbar() {
  const { user, isAuthenticated, isLoadingUser, logout } = useAuth()
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Any navigation closes both menus - otherwise the panel stays open
  // over the page you just landed on.
  useEffect(() => {
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the account dropdown on an outside click or on Escape - the
  // two ways a user expects to dismiss a menu.
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

  // The link is only rendered for an admin; the real gate is the
  // backend 'admin' middleware, not this check.
  const isAdmin = user?.role === 'admin'

  const initials = (user?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative rounded-lg px-3.5 py-2 text-sm font-medium transition',
      'after:absolute after:inset-x-3.5 after:bottom-0.5 after:h-0.5 after:rounded-full after:transition',
      isActive
        ? 'text-brand-600 after:bg-brand-600'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 after:bg-transparent',
    )

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b bg-white/85 backdrop-blur-md transition',
        isScrolled ? 'border-gray-200 shadow-sm' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        {/* Logo + primary links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900">
            <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-600 text-white">
              <KeyRound className="size-4" aria-hidden />
            </span>
            Kridar
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {PUBLIC_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated &&
              PRIVATE_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            {isAdmin && (
              <NavLink to="/admin" className={desktopLinkClass}>
                Administration
              </NavLink>
            )}
          </nav>
        </div>

        {/* Account area */}
        <div className="flex items-center gap-2">
          {isLoadingUser ? null : isAuthenticated ? (
            <>
              <Link
                to="/favorites"
                aria-label="Mes favoris"
                className="hidden size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 sm:flex"
              >
                <Heart className="size-5" aria-hidden />
              </Link>

              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pr-2.5 pl-1 transition hover:border-gray-300 hover:shadow-sm"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {initials || <User className="size-4" aria-hidden />}
                  </span>
                  <span className="hidden max-w-28 truncate text-sm font-medium text-gray-700 lg:block">
                    {user?.name}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
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
                        <User className="size-4 text-gray-400" aria-hidden /> Mon compte
                      </Link>
                      <Link
                        to="/account/settings"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      >
                        <Settings className="size-4 text-gray-400" aria-hidden /> Paramètres
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
                        {logout.isPending ? 'Deconnexion...' : 'Se deconnecter'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                Connexion
              </Link>
              <Link to="/register" className={buttonClasses({ size: 'sm' })}>
                S'inscrire
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMenuOpen}
            className="flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
          >
            {isMenuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile panel. overflow-hidden + max-height keeps the open/close
          smooth without needing an animation library. */}
      <div
        className={cn(
          'overflow-hidden border-gray-100 transition-all duration-200 ease-in-out md:hidden',
          isMenuOpen ? 'max-h-[26rem] border-t opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
          {PUBLIC_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={mobileLinkClass}>
              {link.label}
            </NavLink>
          ))}

          {isLoadingUser ? null : isAuthenticated ? (
            <>
              {PRIVATE_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={mobileLinkClass}>
                  <link.icon className="size-4.5 text-gray-400" aria-hidden />
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/favorites" className={mobileLinkClass}>
                <Heart className="size-4.5 text-gray-400" aria-hidden /> Mes favoris
              </NavLink>
              {/* NotificationBell is itself a <Link>, so it is rendered on
                  its own here rather than wrapped in a NavLink - an <a>
                  inside an <a> is invalid HTML. */}
              <div className="rounded-lg px-3 py-2.5 transition hover:bg-gray-100">
                <NotificationBell showLabel />
              </div>
              {isAdmin && (
                <NavLink to="/admin" className={mobileLinkClass}>
                  <ShieldCheck className="size-4.5 text-gray-400" aria-hidden /> Administration
                </NavLink>
              )}
              <NavLink to="/account" className={mobileLinkClass}>
                <User className="size-4.5 text-gray-400" aria-hidden /> Mon compte
              </NavLink>
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="size-4.5" aria-hidden />
                {logout.isPending ? 'Deconnexion...' : 'Se deconnecter'}
              </button>
            </>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              <Link to="/login" className={buttonClasses({ variant: 'secondary', fullWidth: true })}>
                Connexion
              </Link>
              <Link to="/register" className={buttonClasses({ fullWidth: true })}>
                S'inscrire
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
