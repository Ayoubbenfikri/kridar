import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Google's own multicolour "G" mark, inlined so the button needs no extra
 * network request or icon font. Standard for "Continue with Google"
 * buttons - not Krihouse branding, so it is NOT run through lucide/cn.
 */
function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  )
}

/**
 * Plain <a href>, not a <button> with an onClick/axios call - this has to
 * be a real top-level browser navigation (see GoogleAuthController), the
 * same reasoning as the verify-email link. Shown on both /login and
 * /register: either page can end up creating a Google account (case 3 in
 * the controller), so both carry the terms notice below the button -
 * clicking it IS the acceptance (terms_accepted_at is stamped
 * automatically), there is no separate checkbox to tick first.
 */
export default function GoogleAuthButton() {
  const { t } = useTranslation()

  // Empty string in production (same-origin, see axiosClient.ts) - set
  // only in frontend/.env.local for local dev where Vite and
  // `php artisan serve` are two different ports.
  const href = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/auth/google/redirect`

  return (
    <div className="space-y-4">
      <a
        href={href}
        className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 bg-white text-[15px] font-semibold text-gray-700 transition hover:-translate-y-px hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
      >
        <GoogleIcon />
        {t('auth.continueWithGoogle')}
      </a>

      <p className="text-center text-xs text-gray-400">
        {t('auth.googleTermsPrefix')}{' '}
        <Link
          to="/terms"
          target="_blank"
          rel="noopener"
          className="underline underline-offset-2 transition hover:text-gray-600"
        >
          {t('auth.termsOfUse')}
        </Link>{' '}
        {t('auth.termsAcceptMiddle')}{' '}
        <Link
          to="/privacy"
          target="_blank"
          rel="noopener"
          className="underline underline-offset-2 transition hover:text-gray-600"
        >
          {t('auth.privacyPolicy')}
        </Link>
        .
      </p>

      <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
        <span className="h-px flex-1 bg-gray-200" aria-hidden />
        {t('auth.orDivider')}
        <span className="h-px flex-1 bg-gray-200" aria-hidden />
      </div>
    </div>
  )
}
