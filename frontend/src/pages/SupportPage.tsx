import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Landmark,
  Mail,
  Server,
  Wallet,
} from 'lucide-react'
import { useSupport } from '@/features/settings/useSettings'
import { Card, Skeleton, buttonClasses } from '@/components/ui'
import { track } from '@/lib/analytics'

/**
 * What the PayPal buttons offer, in the configured currency.
 *
 * In code rather than config on purpose: these are a design choice about
 * the page, not a deployment fact, and three is the number that reads as a
 * suggestion instead of a price list. Edit this line to change them.
 */
const PRESET_AMOUNTS = [5, 10, 25]

/**
 * A value people need to copy exactly — a bank account, a crypto address.
 *
 * The text is selectable as well as copyable on purpose: the clipboard API
 * only works on a secure origin (https, or localhost), so on a plain-http
 * deployment the button silently cannot work. Showing the value in a
 * selectable block means the page is still usable when that happens, and
 * the button becomes a convenience rather than the only route.
 */
function CopyableValue({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard permission, or an insecure origin. The value is
      // right there to select by hand, so there is nothing useful to say.
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{label}</p>
      <div className="mt-1.5 flex items-start gap-2">
        <code className="min-w-0 flex-1 rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm break-all text-gray-800">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
          aria-label={copied ? t('support.copied') : t('support.copy')}
        >
          {copied ? (
            <Check className="size-4 text-green-600" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * /support — why Kridar asks for help, and the ways to give it.
 *
 * Every method is optional (config/support.php) and the backend strips the
 * ones that are not set, so this page renders exactly what exists. With
 * nothing configured it says so honestly rather than showing empty rows —
 * which is also what makes it safe to ship before any payment method is
 * sorted out.
 */
export default function SupportPage() {
  const { t } = useTranslation()
  const { data: support, isLoading } = useSupport()

  // `currency` is deliberately NOT in this list: it always has a value (it
  // has a default), so counting it would make the page claim a payment
  // method exists on a completely unconfigured install.
  const hasAnyMethod =
    support !== undefined &&
    Boolean(
      support.paypal_me ||
        support.donate_url ||
        support.bank_details ||
        support.crypto_address ||
        support.contact_email,
    )

  /**
   * PayPal.Me carries the amount in the path — paypal.me/name/25EUR — so a
   * pre-filled button is just a string. No API call, no credentials, and
   * the payment happens entirely on paypal.com; Kridar never sees a card
   * number or a PayPal login.
   *
   * encodeURIComponent on the handle because it comes from config: a value
   * containing a slash would otherwise send the link somewhere else.
   */
  function paypalLink(amount?: number): string {
    const handle = encodeURIComponent(support?.paypal_me ?? '')
    const currency = support?.currency ?? 'EUR'

    return amount === undefined
      ? `https://paypal.me/${handle}`
      : `https://paypal.me/${handle}/${amount}${currency}`
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Helmet>
        <title>Soutenir Krihouse</title>
        <meta
          name="description"
          content="Krihouse est gratuit : pas de frais de publication, pas de commission. Aidez le projet à couvrir ses frais d'hébergement."
        />
      </Helmet>

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('common.backToHome')}
      </Link>

      <div className="mt-5 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Heart className="size-5" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('support.title')}</h1>
      </div>

      <p className="mt-4 text-[17px] text-pretty text-gray-600">{t('support.intro')}</p>

      {/* The one-click option, moved to the top of the page and given its
          own warm amber treatment (matching the Support icon in the nav)
          instead of the plain brand-teal button every other CTA on the
          site uses - this is the one action the page actually wants
          people to take, so it shouldn't look like just another button
          buried under the explanation cards. */}
      {support?.donate_url && (
        <a
          href={support.donate_url}
          onClick={() => track('support_click')}
          target="_blank"
          // noreferrer as well as noopener: the destination is a
          // third-party payment page and has no business knowing which
          // page on Kridar sent the visitor.
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-amber-600 hover:shadow-md"
        >
          <Heart className="size-5" aria-hidden />
          {t('support.donateButton')}
        </a>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900">{t('support.whyTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('support.whyText')}</p>
        </Card>

        <Card className="p-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <Server className="size-4.5" aria-hidden />
          </span>
          <h2 className="mt-3 font-semibold text-gray-900">{t('support.costsTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('support.costsText')}</p>
        </Card>
      </div>

      {/* ---------------------------------------------------------------
          The methods themselves
          --------------------------------------------------------------- */}
      <div className="mt-8 space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </>
        ) : !hasAnyMethod ? (
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900">{t('support.noMethodsTitle')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('support.noMethodsText')}</p>
          </Card>
        ) : (
          <>
            {/* PayPal first when it is configured: it is the one method
                that takes a single click. */}
            {support?.paypal_me && (
              <Card className="p-5">
                <div className="flex items-center gap-2.5">
                  <Heart className="size-4.5 shrink-0 text-brand-600" aria-hidden />
                  <h2 className="font-semibold text-gray-900">{t('support.paypalTitle')}</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500">{t('support.paypalText')}</p>

                {/* Preset amounts. A row of choices gets more help than a
                    bare "donate" link, and PayPal.Me supports it for free
                    by taking the amount in the URL. */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {PRESET_AMOUNTS.map((amount) => (
                    <a
                      key={amount}
                      href={paypalLink(amount)}
                      onClick={() => track('support_click')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClasses({ size: 'sm' })}
                    >
                      {amount} {support.currency ?? 'EUR'}
                    </a>
                  ))}
                  <a
                    href={paypalLink()}
                    onClick={() => track('support_click')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                  >
                    {t('support.otherAmount')}
                  </a>
                </div>
              </Card>
            )}

            {support?.bank_details && (
              <Card className="p-5">
                <div className="flex items-center gap-2.5">
                  <Landmark className="size-4.5 shrink-0 text-gray-400" aria-hidden />
                  <h2 className="font-semibold text-gray-900">{t('support.bankTitle')}</h2>
                </div>
                <div className="mt-4">
                  <CopyableValue
                    label={support.bank_label ?? t('support.bankTitle')}
                    value={support.bank_details}
                  />
                </div>
              </Card>
            )}

            {support?.crypto_address && (
              <Card className="p-5">
                <div className="flex items-center gap-2.5">
                  <Wallet className="size-4.5 shrink-0 text-gray-400" aria-hidden />
                  <h2 className="font-semibold text-gray-900">{t('support.cryptoTitle')}</h2>
                </div>
                <div className="mt-4">
                  <CopyableValue
                    label={support.crypto_label ?? t('support.cryptoTitle')}
                    value={support.crypto_address}
                  />
                </div>
              </Card>
            )}

            {support?.contact_email && (
              <Card className="p-5">
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4.5 shrink-0 text-gray-400" aria-hidden />
                  <h2 className="font-semibold text-gray-900">{t('support.contactTitle')}</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500">{t('support.contactText')}</p>
                <a
                  href={`mailto:${support.contact_email}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand-600 transition hover:text-brand-700"
                >
                  {support.contact_email}
                </a>
              </Card>
            )}
          </>
        )}
      </div>

      <p className="mt-8 text-center text-sm font-medium text-gray-500">{t('support.thanks')}</p>
    </main>
  )
}
