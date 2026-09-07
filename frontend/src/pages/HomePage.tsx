import { Link } from 'react-router-dom'
import { ArrowRight, Building2, ShieldCheck, Sparkles } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'
import PropertyCard from '@/components/properties/PropertyCard'
import { useProperties } from '@/features/properties/useProperties'
import { Card, EmptyState, Skeleton, buttonClasses } from '@/components/ui'

const CITIES = ['Marrakech', 'Casablanca', 'Rabat', 'Tanger', 'Agadir', 'Essaouira']

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
  // Newest published properties. The listing endpoint returns them
  // newest-first, so this is "les derniers logements", not a curated
  // selection - there is no "popular" ranking on the backend to claim.
  const { data, isError } = useProperties({ per_page: 6 })
  const properties = data?.data ?? []

  return (
    <main>
      {/* ---------------------------------------------------------------
          HERO
          --------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* Soft teal wash behind the hero. aria-hidden + pointer-events-none:
            purely decorative, must never catch a click. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(60%_60%_at_50%_50%,var(--color-brand-100),transparent_70%)]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 py-1.5 pr-3.5 pl-2.5 text-[13px] font-medium text-brand-700">
            <Sparkles className="size-3.5" aria-hidden />
            Location courte et longue duree au Maroc
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-5xl">
            Trouvez votre prochain logement au Maroc
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-pretty text-gray-500">
            Appartements, villas et riads a Marrakech, Casablanca, Rabat et partout ailleurs.
            Reservation directe avec le proprietaire.
          </p>

          <div className="mt-9">
            <SearchBar />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CITIES.map((city) => (
              <Link
                key={city}
                to={`/properties?city=${encodeURIComponent(city)}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-600 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          LATEST PROPERTIES
          --------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Derniers logements</h2>
            <p className="mt-1 text-sm text-gray-500">Les propriétés publiées le plus récemment</p>
          </div>
          <Link
            to="/properties"
            className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700 sm:flex"
          >
            Voir tout
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {/* Exhaustive on purpose: error, then "no data yet", then empty,
            then the grid. Written as one cascade so there is no
            combination of states that renders nothing at all. */}
        {isError ? (
          <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Impossible de charger les propriétés pour le moment. Verifie que l'API tourne
            (php artisan serve), puis recharge la page.
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
            title="Aucun logement publié pour le moment"
            description="Les propriétés apparaitront ici des qu'un proprietaire en publiera une."
            action={
              <Link to="/owner/properties/new" className={buttonClasses()}>
                Publier mon logement
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
                Voir toutes les propriétés
              </Link>
            </div>
          </>
        )}

      </section>

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
              Vous avez un logement a louer ?
            </h2>
            <p className="mt-2 text-gray-500">
              Publiez votre annonce, gerez vos disponibilites et vos reservations depuis un seul
              espace. Sans intermediaire.
            </p>
          </div>
          <Link to="/owner" className={buttonClasses({ className: 'shrink-0' })}>
            Devenir proprietaire
          </Link>
        </Card>
      </section>
    </main>
  )
}
