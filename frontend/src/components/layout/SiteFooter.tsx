import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'

/**
 * Minimal footer: identity, the few links that matter, one legal line.
 * Deliberately not a link farm - there is nothing else to put in it yet,
 * and an empty-looking mega footer reads worse than a small honest one.
 */
export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900">
              <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-600 text-white">
                <KeyRound className="size-4" aria-hidden />
              </span>
              Kridar
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Location courte et longue duree au Maroc. Reservation directe entre voyageurs et
              proprietaires.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Explorer</span>
            <Link to="/properties" className="text-gray-600 transition hover:text-brand-600">
              Toutes les proprietes
            </Link>
            <Link to="/favorites" className="text-gray-600 transition hover:text-brand-600">
              Mes favoris
            </Link>
          </nav>

          <nav className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Mon espace</span>
            <Link to="/reservations" className="text-gray-600 transition hover:text-brand-600">
              Mes reservations
            </Link>
            <Link to="/owner" className="text-gray-600 transition hover:text-brand-600">
              Espace proprietaire
            </Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Kridar. Tous droits reserves.
        </p>
      </div>
    </footer>
  )
}
