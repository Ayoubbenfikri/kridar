import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, LogIn, MailWarning, MessageSquare, Send, Sparkles } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useBuyMessagingPack, useStartRoommateConversation } from '@/features/messaging/useMessaging'
import { usePaymentsEnabled, useSettings } from '@/features/settings/useSettings'
import { getErrorMessage, getValidationErrors, isPaymentRequiredError } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import { Badge, Button, Card, Textarea, buttonClasses } from '@/components/ui'
import type { MessagingPackDuration } from '@/features/messaging/messagingApi'
import type { RoommateListing } from '@/types/roommateListing'

/**
 * Same component as ContactOwnerCard (frontend/src/components/properties/),
 * for a roommate post instead of a property. Kept as its own file rather
 * than a shared one taking Property | RoommateListing — same reasoning
 * as MessagingService::startOrContinueRoommate() on the backend: the two
 * listing types share nothing except "has an owner and a published
 * state", and CreditsStatus/MessagingPaywall below are small enough that
 * duplicating them costs less than a forced abstraction.
 *
 * The messaging-credits system itself (free contacts, paywall) is
 * exactly the same system used for properties — roommate posts do not
 * get their own limit, per the product decision that only the
 * publication fee is waived for them, not messaging.
 */
function CreditsStatus() {
  const { user } = useAuth()
  const paymentsEnabled = usePaymentsEnabled()

  if (!paymentsEnabled || !user) return null

  if (user.messaging_pack_expires_at) {
    const expiry = new Date(user.messaging_pack_expires_at).toLocaleDateString('fr-FR')
    return (
      <Badge tone="green" className="mt-2" icon={<Sparkles className="size-3.5" aria-hidden />}>
        Messages illimités jusqu'au {expiry}
      </Badge>
    )
  }

  return (
    <Badge tone={user.free_contacts_remaining > 0 ? 'slate' : 'amber'} className="mt-2">
      {user.free_contacts_remaining} contact{user.free_contacts_remaining > 1 ? 's' : ''} gratuit
      {user.free_contacts_remaining > 1 ? 's' : ''} restant{user.free_contacts_remaining > 1 ? 's' : ''}
    </Badge>
  )
}

function MessagingPaywall() {
  const { data: settings } = useSettings()
  const buyPack = useBuyMessagingPack()
  const [pending, setPending] = useState<MessagingPackDuration | null>(null)

  function buy(duration: MessagingPackDuration) {
    setPending(duration)
    buyPack.mutate(duration, {
      onSuccess: ({ redirectUrl }) => {
        if (redirectUrl) {
          window.location.href = redirectUrl
        }
      },
      onSettled: () => setPending(null),
    })
  }

  return (
    <Card className="mt-4 border-amber-200 bg-amber-50 p-5">
      <span className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
        <Clock className="size-5" aria-hidden />
      </span>
      <p className="mt-3 font-semibold text-amber-900">Contacts gratuits épuisés</p>
      <p className="mt-1 text-sm text-amber-800">
        Achetez un pass pour continuer à contacter des annonces sans limite.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          disabled={buyPack.isPending}
          isLoading={pending === '7d'}
          onClick={() => buy('7d')}
        >
          7 jours{settings ? ` — ${formatMad(settings.messaging_pack_7d_fee)}` : ''}
        </Button>
        <Button disabled={buyPack.isPending} isLoading={pending === '15d'} onClick={() => buy('15d')}>
          15 jours{settings ? ` — ${formatMad(settings.messaging_pack_15d_fee)}` : ''}
        </Button>
      </div>

      {buyPack.isError && (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {getErrorMessage(buyPack.error)}
        </p>
      )}
    </Card>
  )
}

/**
 * "Contacter" on the roommate post page — same entry point role as
 * ContactOwnerCard on PropertyDetailsPage, same guard order so the two
 * never disagree about who may act:
 *   not published -> nothing to contact anyone about
 *   not logged in -> "log in to write"
 *   your own post -> nothing (nobody to write to until someone writes to you)
 *   email not verified -> "verify your email"
 *   402 (out of free contacts, no pass) -> MessagingPaywall
 *   otherwise -> the message form
 */
export default function ContactPosterCard({ listing }: { listing: RoommateListing }) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const startConversation = useStartRoommateConversation()

  const [body, setBody] = useState('')

  if (listing.status !== 'published') {
    return null
  }

  if (!isAuthenticated) {
    return (
      <Card className="mt-4 p-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <LogIn className="size-5" aria-hidden />
        </span>
        <p className="mt-3 font-semibold text-gray-900">Connectez-vous pour écrire</p>
        <p className="mt-1 text-sm text-gray-500">
          Il faut un compte pour envoyer un message à {listing.user.name}.
        </p>
        <Link
          to="/login"
          className={buttonClasses({ variant: 'secondary', fullWidth: true, className: 'mt-4' })}
        >
          Se connecter
        </Link>
      </Card>
    )
  }

  // Your own post: there is nobody to write to until someone writes to
  // you. The backend refuses this too (409).
  if (user?.id === listing.user.id) {
    return null
  }

  if (!user?.email_verified) {
    return (
      <Card className="mt-4 border-amber-200 bg-amber-50 p-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <MailWarning className="size-5" aria-hidden />
        </span>
        <p className="mt-3 font-semibold text-amber-900">Vérifiez votre email</p>
        <p className="mt-1 text-sm text-amber-800">
          L'envoi de messages est réservé aux comptes dont l'adresse email est vérifiée.
        </p>
      </Card>
    )
  }

  if (isPaymentRequiredError(startConversation.error)) {
    return <MessagingPaywall />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const trimmed = body.trim()
    if (trimmed === '') return

    startConversation.mutate(
      { roommateListingId: listing.id, body: trimmed },
      {
        onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
      },
    )
  }

  const validationErrors = getValidationErrors(startConversation.error)
  const isPaywallError = isPaymentRequiredError(startConversation.error)

  return (
    <Card className="mt-4 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <MessageSquare className="size-4.5 text-brand-600" aria-hidden />
        Contacter {listing.user.name}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {listing.type === 'offer'
          ? 'Posez vos questions sur la colocation.'
          : 'Proposez-lui votre logement ou posez une question.'}
      </p>
      <CreditsStatus />

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Textarea
          label="Votre message"
          rows={4}
          maxLength={2000}
          placeholder="Bonjour, cette annonce est-elle toujours d'actualité ?"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          error={validationErrors?.body?.[0]}
        />

        {startConversation.isError && !validationErrors && !isPaywallError && (
          <p className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {getErrorMessage(startConversation.error)}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          variant="secondary"
          icon={<Send className="size-4" />}
          disabled={body.trim() === ''}
          isLoading={startConversation.isPending}
        >
          {startConversation.isPending ? 'Envoi...' : 'Envoyer le message'}
        </Button>
      </form>
    </Card>
  )
}
