import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import NotificationBell from '@/components/notifications/NotificationBell'

export default function Navbar() {
  const { user, isAuthenticated, isLoadingUser, logout } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-brand-700">
            Kridar
          </Link>
          <Link to="/properties" className="text-sm text-gray-600 hover:text-brand-700">
            Propriétés
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          {isLoadingUser ? null : isAuthenticated ? (
            <>
              <NotificationBell />
              <Link to="/favorites" className="text-gray-600 hover:text-brand-700">
                Mes favoris
              </Link>
              <Link to="/reservations" className="text-gray-600 hover:text-brand-700">
                Mes réservations
              </Link>
              <Link to="/account" className="text-gray-700 hover:text-brand-700">
                {user?.name}
              </Link>
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
              >
                Se deconnecter
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-brand-600 hover:underline">
                Connexion
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
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
