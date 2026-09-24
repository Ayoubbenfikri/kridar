import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound } from 'lucide-react'

/**
 * Shared frame for /login and /register: one centred card, the Kridar
 * mark, a title and a subtitle. Having it in one place is what keeps
 * the two pages from slowly drifting apart.
 *
 * title and subtitle stay PROPS rather than becoming translation keys
 * inside here: the two pages differ only by those two strings, and
 * passing them in is what makes that obvious at the call site.
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <main className="relative flex min-h-[calc(100vh-68px)] items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-80 bg-[radial-gradient(50%_60%_at_50%_50%,var(--color-brand-100),transparent_70%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            to="/"
            className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:-translate-y-px hover:shadow-md"
            aria-label={t('common.backToHome')}
          >
            <KeyRound className="size-5" aria-hidden />
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">{children}</div>
      </div>
    </main>
  )
}
