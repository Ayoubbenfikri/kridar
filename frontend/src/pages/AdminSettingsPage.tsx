import { useEffect, useState, type FormEvent } from 'react'
import { Building2, CalendarCheck, CreditCard, MessageSquare, Phone, TriangleAlert } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/features/settings/useSettings'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Input, Skeleton, useToast } from '@/components/ui'

/**
 * /admin/settings - Kridar's configurable numbers.
 *
 * The fee and the rate are SNAPSHOTTED at the moment they are used (the
 * fee onto the payment when the owner pays, the commission onto the
 * reservation when a booking is created), so changing them here only
 * ever affects future listings and future bookings. Nothing already
 * agreed is rewritten - that promise is what the notice under the save
 * button states.
 *
 * The conversion rate is different: it is read fresh on every PayPal
 * call, because it is not a price, it is an exchange rate.
 */
export default function AdminSettingsPage() {
  const { data: settings, isError, error } = useSettings()
  const updateSettings = useUpdateSettings()
  const { showToast } = useToast()

  // The inputs are plain strings while the user types (an <input> value
  // always is) and only become numbers on submit.
  const [fee, setFee] = useState('')
  const [rate, setRate] = useState('')
  const [paypalRate, setPaypalRate] = useState('')
  const [phoneRevealFee, setPhoneRevealFee] = useState('')
  const [pack7dFee, setPack7dFee] = useState('')
  const [pack15dFee, setPack15dFee] = useState('')

  // Fill the form once the current values arrive. Keyed on `settings`
  // so a successful save (which rewrites the cache) also re-syncs the
  // fields with whatever the server actually stored.
  useEffect(() => {
    if (settings) {
      setFee(String(settings.listing_publication_fee))
      setRate(String(settings.short_term_commission_rate))
      setPaypalRate(String(settings.mad_to_paypal_rate))
      setPhoneRevealFee(String(settings.phone_reveal_fee))
      setPack7dFee(String(settings.messaging_pack_7d_fee))
      setPack15dFee(String(settings.messaging_pack_15d_fee))
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
        mad_to_paypal_rate: Number(paypalRate),
        phone_reveal_fee: Number(phoneRevealFee),
        messaging_pack_7d_fee: Number(pack7dFee),
        messaging_pack_15d_fee: Number(pack15dFee),
      },
      {
        onSuccess: () => showToast('success', 'Tarification mise a jour.'),
      },
    )
  }

  // Live preview of what PayPal would be charged for the publication
  // fee - the fastest way to spot a rate typed the wrong way round.
  const parsedPaypalRate = Number(paypalRate)
  const convertedFee =
    parsedPaypalRate > 0 ? (Number(fee) / parsedPaypalRate).toFixed(2) : null

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tarification</h1>
      <p className="mt-1 text-sm text-gray-500">
        Les revenus de Kridar (Phase 29) et la conversion vers PayPal.
      </p>

      {!settings ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
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
                <h2 className="font-semibold text-gray-900">Annonces supplementaires</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Le premier bien d'un proprietaire est toujours gratuit, quel que soit son type de
                  location. Chaque annonce supplementaire coute ces frais fixes, payes une seule
                  fois. Kridar ne prend aucune commission sur le loyer et ne gere ni le contrat ni
                  l'encaissement.
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
                <h2 className="font-semibold text-gray-900">Courte duree (desactive)</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Pourcentage preleve sur chaque reservation courte duree. Desactive depuis la
                  refonte de la tarification (Phase 29) — chaque reservation est enregistree avec
                  une commission de 0, quel que soit ce taux. Garde configurable pour une
                  reactivation future.
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
                <strong className="text-gray-900">{(1000 * (Number(rate) || 0)) / 100} MAD</strong>,
                le proprietaire recoit{' '}
                <strong className="text-gray-900">
                  {1000 - (1000 * (Number(rate) || 0)) / 100} MAD
                </strong>
                .
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Phone className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">Revelation du numero</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ce qu'un utilisateur paie une seule fois pour voir le numero du proprietaire
                  d'une annonce. Independant de la messagerie — un utilisateur sans contacts
                  gratuits peut toujours reveler un numero.
                </p>
              </div>
            </div>

            <div className="mt-4 max-w-xs">
              <Input
                label="Frais de revelation"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={phoneRevealFee}
                onChange={(event) => setPhoneRevealFee(event.target.value)}
                error={validationErrors?.phone_reveal_fee?.[0]}
                hint="En MAD. Mettre 0 pour reveler gratuitement."
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <MessageSquare className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">Pass messagerie</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Chaque compte dispose de 5 contacts gratuits (une seule fois par annonceur
                  contacte pour la premiere fois). Une fois epuises, un pass donne des messages
                  illimites pendant la duree choisie.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Pass 7 jours"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={pack7dFee}
                onChange={(event) => setPack7dFee(event.target.value)}
                error={validationErrors?.messaging_pack_7d_fee?.[0]}
                hint="En MAD."
              />
              <Input
                label="Pass 15 jours"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={pack15dFee}
                onChange={(event) => setPack15dFee(event.target.value)}
                error={validationErrors?.messaging_pack_15d_fee?.[0]}
                hint="En MAD."
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <CreditCard className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">Conversion PayPal</h2>
                <p className="mt-1 text-sm text-gray-500">
                  PayPal n'accepte pas le dirham. Chaque montant est converti juste avant l'appel,
                  avec ce taux. Les montants stockes par Kridar restent en MAD.
                </p>
              </div>
            </div>

            <div className="mt-4 max-w-xs">
              <Input
                label="1 EUR vaut"
                type="number"
                min={0.01}
                step="0.01"
                inputMode="decimal"
                value={paypalRate}
                onChange={(event) => setPaypalRate(event.target.value)}
                error={validationErrors?.mad_to_paypal_rate?.[0]}
                hint="En MAD. Exemple : 10.80"
              />
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
              {convertedFee !== null ? (
                <p className="text-gray-600">
                  Les frais de publication de{' '}
                  <strong className="text-gray-900">{Number(fee) || 0} MAD</strong> seront factures{' '}
                  <strong className="text-gray-900">{convertedFee} EUR</strong> par PayPal.
                </p>
              ) : (
                <p className="text-amber-700">
                  Le taux doit etre superieur a zero — le backend divise par cette valeur.
                </p>
              )}
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
              Chaque frais est enregistre au moment ou il est paye — changer un montant ici n'affecte
              jamais ce qui a deja ete facture.
            </p>
          </div>
        </form>
      )}
    </>
  )
}
