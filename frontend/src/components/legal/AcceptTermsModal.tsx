import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui'

/**
 * Full-screen BLOCKING overlay — not a dismissible banner like
 * VerifyEmailBanner. Shown whenever a logged-in account's
 * needs_terms_acceptance is true: either it registered before this
 * feature existed (terms_version still null) or the wording changed
 * since it last accepted (config('legal.terms_version') on the backend
 * was bumped). Mounted once in AppLayout, right after Navbar, so it
 * covers every route no matter which page the person lands on — being
 * `fixed inset-0`, where it sits in the DOM does not matter.
 *
 * Never shown to a visitor filling in the registration form: that flow
 * already accepts the current version as part of registering (see
 * RegisterForm + AuthController::register()), so a brand-new account's
 * needs_terms_acceptance is false the moment /auth/me first loads.
 *
 * Deliberately not a dead end — reading the documents opens in a new tab
 * (the modal itself never navigates away and stays blocking), and
 * "Se déconnecter" is there on purpose so refusing to accept means
 * leaving, not being stuck looking at a wall forever.
 */
export default function AcceptTermsModal() {
  const { t } = useTranslation()
  const { user, isAuthenticated, acceptTerms, logout } = useAuth()

  if (!isAuthenticated || !user?.needs_terms_acceptance) return null

  return (
    // z-[1100]: PropertiesMapView/LocationPicker's Leaflet panes can climb
    // to z-index 1000 internally (see their `isolate` wrapper comments) -
    // this must sit above even that, since a not-yet-accepted user could
    // land on the map view while this is showing.
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ShieldCheck className="size-5" aria-hidden />
        </span>

        <h2 className="mt-4 text-lg font-bold text-gray-900">{t('legal.modalTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('legal.modalIntro')}</p>

        <div className="mt-4 flex flex-col gap-1.5 text-sm">
          <Link
            to="/terms"
            target="_blank"
            rel="noopener"
            className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            {t('auth.termsOfUse')}
          </Link>
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener"
            className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            {t('auth.privacyPolicy')}
          </Link>
        </div>

        <Button
          type="button"
          fullWidth
          className="mt-6"
          isLoading={acceptTerms.isPending}
          onClick={() => acceptTerms.mutate()}
        >
          {t('legal.modalButton')}
        </Button>

        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="mt-3 w-full text-center text-xs text-gray-400 underline underline-offset-2 transition hover:text-gray-600 disabled:opacity-50"
        >
          {t('nav.logout')}
        </button>
      </div>
    </div>
  )
}
