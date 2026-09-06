import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import NotificationBell from '@/components/notifications/NotificationBell'

const LINK_CLASS = 'text-gray-600 transition-colors duration-150 hover:text-brand-700'
const MOBILE_LINK_CLASS = `py-2 ${LINK_CLASS}`

/**
 * Responsive navbar: the full link list shows inline from `md` up.
 * Below that it collapses into a hamburger-triggered panel (plain CSS
 * max-height/opacity transition, no animation library) so it never
 * overflows on a phone. The two link lists are written out twice
 * (desktop row vs mobile column) rather than shared through one
 * component — the layout differs enough (icon-only bell vs bell+label,
 * inline vs stacked) that sharing would need more abstraction than it's
 * worth here.
 */
export default function Navbar() {
  const { user, isAuthenticated, isLoadingUser, logout } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Always start on a fresh page with the mobile menu closed.
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-brand-700">
            Kridar
          </Link>
          <Link to="/properties" className={`hidden md:inline ${LINK_CLASS} text-sm`}>
            Propriétés
          </Link>
        </div>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          {isLoadingUser ? null : isAuthenticated ? (
            <>
              <NotificationBell />
              <Link to="/favorites" className={LINK_CLASS}>
                Mes favoris
              </Link>
              <Link to="/reservations" className={LINK_CLASS}>
                Mes réservations
              </Link>
              <Link to="/owner" className={LINK_CLASS}>
                Espace proprietaire
              </Link>
              <Link to="/account" className="text-gray-700 transition-colors duration-150 hover:text-brand-700">
                {user?.name}
              </Link>
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="rounded-lg border border-gray-300 px-3 py-1.5 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50"
              >
                Se deconnecter
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-brand-600 transition-colors duration-150 hover:underline">
                Connexion
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-white transition-colors duration-150 hover:bg-brand-700"
              >
                S'inscrire
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isMenuOpen}
          className="rounded-lg px-2 py-1 text-xl text-gray-600 transition-colors duration-150 hover:bg-gray-100 md:hidden"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu panel. overflow-hidden + max-height/opacity gives a
          smooth open/close without needing any animation library. */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out md:hidden ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 border-t border-gray-100 px-4 py-3 text-sm">
          <Link to="/properties" className={MOBILE_LINK_CLASS}>
            Propriétés
          </Link>

          {isLoadingUser ? null : isAuthenticated ? (
            <>
              <div className="py-2">
                <NotificationBell showLabel />
              </div>
              <Link to="/favorites" className={MOBILE_LINK_CLASS}>
                Mes favoris
              </Link>
              <Link to="/reservations" className={MOBILE_LINK_CLASS}>
                Mes réservations
              </Link>
              <Link to="/owner" className={MOBILE_LINK_CLASS}>
                Espace proprietaire
              </Link>
              <Link
                to="/account"
                className="py-2 text-gray-700 transition-colors duration-150 hover:text-brand-700"
              >
                {user?.name}
              </Link>
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="mt-1 w-fit rounded-lg border border-gray-300 px-3 py-1.5 text-left transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50"
              >
                Se deconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="py-2 text-brand-600 transition-colors duration-150 hover:underline"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="mt-1 w-fit rounded-lg bg-brand-600 px-3 py-1.5 text-white transition-colors duration-150 hover:bg-brand-700"
              >
                S'inscrire
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
