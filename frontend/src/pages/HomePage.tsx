import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  Building2,
  Heart,
  ShieldCheck,
} from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'
import PropertyCard from '@/components/properties/PropertyCard'
import { useProperties } from '@/features/properties/useProperties'
import { Card, EmptyState, Skeleton, buttonClasses } from '@/components/ui'
import type { SearchMode } from '@/lib/homeSearch'
import { OWNER_START_PATH } from '@/lib/safeRedirect'

/** Same shape as a PropertyCard, so the grid does not jump on load. */
function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2.5 h-3.5 w-1/2" />
        <Skeleton className="mt-4 h-3.5 w-full" />
        <Skeleton className="mt-4 h-5 w-2/5" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  // The search bar's intent tab (short stay / monthly / buy).
  const [mode, setMode] = useState<SearchMode>('short')

  // Newest published properties. The listing endpoint returns them
  // newest-first, so this is "the latest homes", not a curated
  // selection - there is no "popular" ranking on the backend to claim.
  const { data, isError } = useProperties({ per_page: 6 })
  const properties = data?.data ?? []

  // Rentals only: the default search is rent (see the repository), so the
  // list above never mixes in sales. Sales get their own section below,
  // and only when there is at least one - an empty "for sale" shelf on
  // launch day would look broken, not honest.
  const { data: saleData } = useProperties({ listing_type: 'sale', per_page: 3 })
  const saleProperties = saleData?.data ?? []

  return (
    <main>
      <Helmet>
        <title>Krihouse — Louer et acheter un bien au Maroc</title>
        <meta
          name="description"
          content="Trouvez ou publiez un appartement, une villa, un studio, un riad ou un terrain à louer ou à vendre au Maroc. Contact direct entre voyageurs, acheteurs et propriétaires, sans commission."
        />
      </Helmet>

      {/* ---------------------------------------------------------------
          HERO
          --------------------------------------------------------------- */}
      <section className="relative">
        {/* Soft teal wash behind the hero. aria-hidden + pointer-events-none:
            purely decorative, must never catch a click. It clips ITSELF
            (overflow-hidden on this wrapper) instead of the whole section:
            the budget panel of the search bar opens downward and must be
            allowed to overflow the section. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(60%_60%_at_50%_50%,var(--color-brand-100),transparent_70%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-5 pb-8 text-center sm:px-6 sm:pt-12 sm:pb-12">
          {/* Owner UX (Oct 2026): a visible headline again, and only the
              search under it - the city chips and type tiles that used to
              follow made the page read as a wall of filters. */}
          {/* Not shown (phone or desktop): the search is the first thing on
              screen. The heading stays for screen readers and search
              engines (sr-only). */}
          <h1 className="sr-only">{t('home.title')}</h1>

          <div>
            <SearchBar mode={mode} onModeChange={setMode} />
          </div>

          {/* Owner UX: visible without scrolling, for the owners the ads
              bring here. Same target as the navbar button. */}
          <Link
            to={OWNER_START_PATH}
            className="group mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white/80 py-1 ps-1 pe-3 text-[13px] text-gray-600 shadow-sm backdrop-blur transition hover:border-brand-200 hover:shadow-md sm:mt-6 sm:text-sm"
          >
            <span className="shrink-0 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              {t('home.ownerHintBadge')}
            </span>
            <span className="truncate">
              {t('home.ownerHint')} <span className="font-semibold text-brand-700">{t('home.ownerHintCta')}</span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-brand-600 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          LATEST PROPERTIES
          --------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{t('home.latest')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('home.latestSubtitle')}</p>
          </div>
          <Link
            to="/properties"
            className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700 sm:flex"
          >
            {t('home.seeAll')}
            {/* rtl:rotate-180 so the arrow points the way reading goes. */}
            <ArrowRight
              className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180"
              aria-hidden
            />
          </Link>
        </div>

        {/* Exhaustive on purpose: error, then "no data yet", then empty,
            then the grid. Written as one cascade so there is no
            combination of states that renders nothing at all. */}
        {isError ? (
          <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {t('home.loadError')}
          </Card>
        ) : !data ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-6" />}
            title={t('home.emptyTitle')}
            description={t('home.emptyDescription')}
            action={
              <Link to={OWNER_START_PATH} className={buttonClasses()}>
                {t('home.publishCta')}
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="mt-8 flex justify-center sm:hidden">
              <Link to="/properties" className={buttonClasses({ variant: 'secondary' })}>
                {t('home.seeAllProperties')}
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ---------------------------------------------------------------
          FOR SALE (only shown when something is for sale)
          --------------------------------------------------------------- */}
      {saleProperties.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {t('search.saleTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{t('search.saleSubtitle')}</p>
            </div>
            <Link
              to="/buy"
              className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              {t('search.seeAllSales')}
              <ArrowRight
                className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180"
                aria-hidden
              />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saleProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------
          OWNER CALL TO ACTION
          --------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-lg">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
              {t('home.ownerTitle')}
            </h2>
            <p className="mt-2 text-gray-500">{t('home.ownerText')}</p>
          </div>
          {/* Phase O1: straight to the listing form - a new owner has
              nothing to see on the dashboard yet. Logged out, ProtectedRoute
              sends them to /register and back here afterwards. */}
          <Link to={OWNER_START_PATH} className={buttonClasses({ className: 'shrink-0' })}>
            {t('home.ownerCta')}
          </Link>
        </Card>

        {/* ---------------------------------------------------------------
            SUPPORT (Phase 28)

            Kridar launches free, so this is the only ask on the page. It
            still sits BELOW the owner call to action on purpose: getting a
            listing published is worth more to the project right now than a
            donation, and putting the money ask first would compete with
            it. Made visually stronger than before (filled icon badge,
            brand-tinted card, primary button) so it doesn't read as an
            afterthought now that it's the main donate CTA - the footer
            link and this section are the two places it lives.
            --------------------------------------------------------------- */}
        <Card className="mt-4 flex flex-col items-start gap-4 border-brand-100 bg-brand-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Heart className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('home.supportTitle')}</h2>
              <p className="mt-1 text-sm text-gray-600">{t('home.supportText')}</p>
            </div>
          </div>
          <Link to="/support" className={buttonClasses({ size: 'sm', className: 'shrink-0' })}>
            {t('home.supportCta')}
          </Link>
        </Card>
      </section>
    </main>
  )
}
