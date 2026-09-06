import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { useCreateReservation } from '@/features/reservations/useReservations'
import AvailabilityCalendar from './AvailabilityCalendar'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import type { Property } from '@/types/property'
import type { ReservationRentalType } from '@/types/reservation'

interface BookingPanelProps {
  property: Property
}

/**
 * The actual booking form on PropertyDetailsPage (Phase 18). Only
 * renders something useful when there's actually something to book:
 * logged in, verified, not the property's own owner, and the property
 * is published. total_price always comes back from the server response
 * after submitting - it is never calculated here, since pricing rules
 * (see backend PricingService) live on the backend only.
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
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <Link to="/login" className="text-brand-600 transition hover:underline">
          Connectez-vous
        </Link>{' '}
        pour reserver cette propriete.
      </div>
    )
  }

  if (user?.id === property.owner.id) {
    return null
  }

  if (!user?.email_verified) {
    return (
      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Verifiez votre adresse email pour pouvoir reserver.
      </div>
    )
  }

  function handleSelectRentalType(type: ReservationRentalType) {
    setRentalType(type)
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
      <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
        <p className="font-medium">Demande de reservation envoyee !</p>
        <p className="mt-1 text-sm">
          Total : {formatMad(reservation.total_price)} - en attente de confirmation du proprietaire (48h max).
        </p>
        <Link to="/reservations" className="mt-2 inline-block text-sm text-brand-600 transition hover:underline">
          Voir mes reservations →
        </Link>
      </div>
    )
  }

  const validationErrors = getValidationErrors(createReservation.error)

  return (
    <div className="mt-6 rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 font-semibold text-brand-700">Reserver ce logement</h2>

      {offersBoth && (
        <div className="mb-4 flex gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={rentalType === 'short_term'}
              onChange={() => handleSelectRentalType('short_term')}
            />
            Courte duree (nuitee)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={rentalType === 'long_term'}
              onChange={() => handleSelectRentalType('long_term')}
            />
            Longue duree (mensuel)
          </label>
        </div>
      )}

      <AvailabilityCalendar
        propertyId={property.id}
        startDate={startDate}
        endDate={endDate}
        onChange={(start, end) => {
          setStartDate(start)
          setEndDate(end)
        }}
      />

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="flex gap-6 text-sm text-gray-600">
          <span>
            Arrivee : <strong className="text-gray-800">{startDate ?? '—'}</strong>
          </span>
          <span>
            Depart : <strong className="text-gray-800">{endDate ?? '—'}</strong>
          </span>
        </div>

        {rentalType === 'short_term' && (
          <div>
            <label htmlFor="guests_count" className="mb-1 block text-sm font-medium text-gray-700">
              Nombre de voyageurs {property.max_guests !== null && `(max ${property.max_guests})`}
            </label>
            <input
              id="guests_count"
              type="number"
              min={1}
              max={property.max_guests ?? undefined}
              value={guestsCount}
              onChange={(event) => setGuestsCount(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        )}

        {validationErrors && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {Object.values(validationErrors)
              .flat()
              .map((message) => (
                <p key={message}>{message}</p>
              ))}
          </div>
        )}
        {createReservation.isError && !validationErrors && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(createReservation.error)}
          </div>
        )}

        <button
          type="submit"
          disabled={!startDate || !endDate || createReservation.isPending}
          className="w-full rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2 text-white font-semibold shadow-lg shadow-brand-900/30 transition hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-brand-900/40 active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
        >
          {createReservation.isPending ? 'Envoi...' : 'Demander a reserver'}
        </button>
      </form>
    </div>
  )
}
