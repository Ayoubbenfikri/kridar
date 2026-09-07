import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CalendarCheck, CheckCircle2, LogIn, MailWarning } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useCreateReservation } from '@/features/reservations/useReservations'
import AvailabilityCalendar from './AvailabilityCalendar'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import { Button, Card, Input, buttonClasses } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Property } from '@/types/property'
import type { ReservationRentalType } from '@/types/reservation'

interface BookingPanelProps {
  property: Property
}

/**
 * The booking form on PropertyDetailsPage. Only renders something to
 * submit when there IS something to book: logged in, verified, not the
 * property's own owner, and the property published. total_price always
 * comes back from the server response after submitting - it is never
 * calculated here, since the pricing rules (backend PricingService)
 * live on the backend only.
 */
export default function BookingPanel({ property }: BookingPanelProps) {
  const { user, isAuthenticated } = useAuth()
  const createReservation = useCreateReservation()

  const offersBoth = property.rental_type === 'both'
  const [rentalType, setRentalType] = useState<ReservationRentalType>(
    property.rental_type === 'long_term' ? 'long_term' : 'short_term',
  )
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [guestsCount, setGuestsCount] = useState('')

  if (property.status !== 'published') {
    return null
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <LogIn className="size-5" aria-hidden />
        </span>
        <p className="mt-3 font-semibold text-gray-900">Connectez-vous pour réserver</p>
        <p className="mt-1 text-sm text-gray-500">
          Il faut un compte pour envoyer une demande de réservation au propriétaire.
        </p>
        <Link to="/login" className={buttonClasses({ fullWidth: true, className: 'mt-4' })}>
          Se connecter
        </Link>
      </Card>
    )
  }

  if (user?.id === property.owner.id) {
    return null
  }

  if (!user?.email_verified) {
    return (
      <Card className="border-amber-200 bg-amber-50 p-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <MailWarning className="size-5" aria-hidden />
        </span>
        <p className="mt-3 font-semibold text-amber-900">Vérifiez votre email</p>
        <p className="mt-1 text-sm text-amber-800">
          La réservation est réservée aux comptes dont l'adresse email est vérifiée.
        </p>
      </Card>
    )
  }

  function handleSelectRentalType(type: ReservationRentalType) {
    setRentalType(type)
    // The two modes do not book the same thing (nights vs months), so a
    // range picked in one mode must not carry over to the other.
    setStartDate(null)
    setEndDate(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!startDate || !endDate) return

    createReservation.mutate({
      property_id: property.id,
      rental_type: rentalType,
      start_date: startDate,
      end_date: endDate,
      guests_count: rentalType === 'short_term' && guestsCount ? Number(guestsCount) : undefined,
    })
  }

  if (createReservation.isSuccess) {
    const reservation = createReservation.data
    return (
      <Card className="border-green-200 bg-green-50 p-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
          <CheckCircle2 className="size-5" aria-hidden />
        </span>
        <p className="mt-3 font-semibold text-green-900">Demande envoyée</p>
        <p className="mt-1 text-sm text-green-800">
          Total : <strong>{formatMad(reservation.total_price)}</strong>. Le propriétaire a 48h pour
          confirmer.
        </p>
        <Link
          to="/reservations"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-900 transition hover:gap-2.5"
        >
          Voir mes réservations
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Card>
    )
  }

  const validationErrors = getValidationErrors(createReservation.error)

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <CalendarCheck className="size-4.5 text-brand-600" aria-hidden />
        Réserver ce logement
      </h2>

      {offersBoth && (
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
          {(
            [
              ['short_term', 'Courte durée'],
              ['long_term', 'Longue durée'],
            ] as Array<[ReservationRentalType, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSelectRentalType(value)}
              aria-pressed={rentalType === value}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition',
                rentalType === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <AvailabilityCalendar
          propertyId={property.id}
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start)
            setEndDate(end)
          }}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Arrivée</p>
            <p className="text-sm font-medium text-gray-900">{startDate ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Départ</p>
            <p className="text-sm font-medium text-gray-900">{endDate ?? '—'}</p>
          </div>
        </div>

        {rentalType === 'short_term' && (
          <Input
            label="Nombre de voyageurs"
            type="number"
            min={1}
            max={property.max_guests ?? undefined}
            value={guestsCount}
            onChange={(event) => setGuestsCount(event.target.value)}
            hint={property.max_guests !== null ? `${property.max_guests} maximum` : undefined}
          />
        )}

        {validationErrors && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {Object.values(validationErrors)
              .flat()
              .map((message) => (
                <p key={message} className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {message}
                </p>
              ))}
          </div>
        )}
        {createReservation.isError && !validationErrors && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {getErrorMessage(createReservation.error)}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={!startDate || !endDate}
          isLoading={createReservation.isPending}
        >
          {createReservation.isPending ? 'Envoi...' : 'Demander à réserver'}
        </Button>

        <p className="text-center text-xs text-gray-500">
          Le prix total est calculé par le serveur après la demande.
        </p>
      </form>
    </Card>
  )
}
