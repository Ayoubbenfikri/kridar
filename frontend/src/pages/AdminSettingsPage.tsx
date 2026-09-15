import { useEffect, useState, type FormEvent } from 'react'
import { Building2, CalendarCheck, TriangleAlert } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/features/settings/useSettings'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Input, Skeleton, useToast } from '@/components/ui'

/**
 * /admin/settings - Kridar's two prices.
 *
 * Both values are SNAPSHOTTED at the moment they are used (the fee onto
 * the payment when the owner pays, the rate onto the reservation when a
 * booking is created), so changing them here only ever affects future
 * listings and future bookings. Nothing already agreed is rewritten -
 * that promise is what the notice at the bottom of the page states.
 */
export default function AdminSettingsPage() {
  const { data: settings, isError, error } = useSettings()
  const updateSettings = useUpdateSettings()
  const { showToast } = useToast()

  // The inputs are plain strings while the user types (an <input> value
  // always is) and only become numbers on submit.
  const [fee, setFee] = useState('')
  const [rate, setRate] = useState('')

  // Fill the form once the current values arrive. Keyed on `settings`
  // so a successful save (which rewrites the cache) also re-syncs the
  // fields with whatever the server actually stored.
  useEffect(() => {
    if (settings) {
      setFee(String(settings.listing_publication_fee))
      setRate(String(settings.short_term_commission_rate))
    }
  }, [settings])

  if (isError) {
    return (
      <>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tarification</h1>
        <Card className="mt-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          {getErrorMessage(error)}
        </Card>
      </>
    )
  }

  const validationErrors = getValidationErrors(updateSettings.error)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    updateSettings.mutate(
      {
        listing_publication_fee: Number(fee),
        short_term_commission_rate: Number(rate),
      },
      {
        onSuccess: () => showToast('success', 'Tarification mise a jour.'),
      },
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tarification</h1>
      <p className="mt-1 text-sm text-gray-500">
        Les deux sources de revenus de Kridar, modifiables a tout moment.
      </p>

      {!settings ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Building2 className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">Longue duree</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Frais fixes payes une seule fois par le proprietaire pour publier son annonce.
                  Kridar ne prend aucune commission sur le loyer et ne gere ni le contrat ni
                  l'encaissement. La recherche reste gratuite pour le locataire.
                </p>
              </div>
            </div>

            <div className="mt-4 max-w-xs">
              <Input
                label="Frais de publication"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={fee}
                onChange={(event) => setFee(event.target.value)}
                error={validationErrors?.listing_publication_fee?.[0]}
                hint="En MAD. Mettre 0 pour une periode de publication gratuite."
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <CalendarCheck className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">Courte duree</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Pourcentage preleve sur chaque reservation courte duree. Le locataire paie le
                  total affiche, le proprietaire recoit le total moins cette commission.
                </p>
              </div>
            </div>

            <div className="mt-4 max-w-xs">
              <Input
                label="Commission Kridar"
                type="number"
                min={0}
                max={100}
                step="0.01"
                inputMode="decimal"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                error={validationErrors?.short_term_commission_rate?.[0]}
                hint="En pourcentage. 10 = 10%."
              />
            </div>

            {/* A live worked example on 1 000 MAD - the fastest way for an
                admin to check they typed what they meant. */}
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-semibold text-gray-900">Exemple sur une reservation de 1 000 MAD</p>
              <p className="mt-1 text-gray-600">
                Kridar percoit{' '}
                <strong className="text-gray-900">
                  {(1000 * (Number(rate) || 0)) / 100} MAD
                </strong>
                , le proprietaire recoit{' '}
                <strong className="text-gray-900">
                  {1000 - (1000 * (Number(rate) || 0)) / 100} MAD
                </strong>
                .
              </p>
            </div>
          </Card>

          {updateSettings.isError && !validationErrors && (
            <Card className="flex items-start gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
              {getErrorMessage(updateSettings.error)}
            </Card>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" isLoading={updateSettings.isPending}>
              {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <p className="text-xs text-gray-500">
              S'applique aux futures annonces et reservations uniquement.
            </p>
          </div>
        </form>
      )}
    </>
  )
}
