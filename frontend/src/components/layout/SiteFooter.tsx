import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound } from 'lucide-react'

/**
 * Minimal footer: identity, the few links that matter, one legal line.
 * Deliberately not a link farm - there is nothing else to put in it yet,
 * and an empty-looking mega footer reads worse than a small honest one.
 *
 * RTL: nothing to convert. Every rule here is flex with `gap`, which
 * reverses on its own under dir="rtl".
 */
export default function SiteFooter() {
  const { t } = useTranslation()

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
            <p className="mt-3 text-sm text-gray-500">{t('footer.tagline')}</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              {t('footer.explore')}
            </span>
            <Link to="/properties" className="text-gray-600 transition hover:text-brand-600">
              {t('footer.allProperties')}
            </Link>
            <Link to="/favorites" className="text-gray-600 transition hover:text-brand-600">
              {t('nav.favorites')}
            </Link>
          </nav>

          <nav className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              {t('footer.mySpace')}
            </span>
            <Link to="/reservations" className="text-gray-600 transition hover:text-brand-600">
              {t('nav.myReservations')}
            </Link>
            <Link to="/owner" className="text-gray-600 transition hover:text-brand-600">
              {t('nav.ownerSpace')}
            </Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-400">
          {t('footer.rights', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}
