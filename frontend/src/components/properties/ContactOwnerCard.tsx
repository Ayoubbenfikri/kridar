import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, LogIn, MailWarning, MessageSquare, Send, Sparkles } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useBuyMessagingPack, useStartConversation } from '@/features/messaging/useMessaging'
import { usePaymentsEnabled, useSettings } from '@/features/settings/useSettings'
import { getErrorMessage, getValidationErrors, isPaymentRequiredError } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import { Badge, Button, Card, Textarea, buttonClasses } from '@/components/ui'
import type { MessagingPackDuration } from '@/features/messaging/messagingApi'
import type { Property } from '@/types/property'

/**
 * The messaging-credits status line: free contacts remaining, or the
 * active pass and when it runs out. Only shown while payments are
 * actually enabled — while Kridar is free the limit does not exist, so
 * advertising "3 contacts left" would just be confusing.
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

/**
 * Shown instead of the message form once startConversation comes back
 * with a 402 — the sender is out of free contacts and has no active
 * pass (MessagingCreditsExhaustedException on the backend). Offers the
 * only way forward: buy a pass.
 *
 * Same "leave the app, come back through the gateway" pattern as every
 * other payment in Kridar (see OwnerPropertiesPage) — nothing here is
 * unlocked until the payer returns through the return URL.
 */
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
        Achetez un pass pour continuer à contacter des propriétaires sans limite.
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
 * "Contacter le propriétaire" on the property page — the entry point for
 * the whole messaging feature.
 *
 * It matters most for LONG-TERM listings: the owner pays the publication
 * fee to be found, and Kridar deliberately does not handle the lease or
 * collect the rent. Without this, a tenant who finds the listing has no
 * way to reach anyone.
 *
 * The guards mirror BookingPanel on purpose — same conditions, same
 * order, so the two panels never disagree about who may act.
 *
 * Phase 29 (monetization overhaul): starting a genuinely NEW conversation
 * can be refused with a 402 once the sender's 5 free contacts are spent
 * and no pass is active — MessagingPaywall above takes over in that
 * case. Replying in an existing thread is never affected (this
 * component only ever starts new ones).
 */
export default function ContactOwnerCard({ property }: { property: Property }) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const startConversation = useStartConversation()

  const [body, setBody] = useState('')

  // Nothing to contact anyone about on a listing that is not public.
  if (property.status !== 'published') {
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
          Il faut un compte pour envoyer un message au propriétaire.
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

  // Your own listing: there is nobody to write to until someone writes
  // to you. The backend refuses this too (409).
  if (user?.id === property.owner.id) {
    return null
  }

  if (!user?.email_verified) {
    // Same reason as BookingPanel: the route is behind `verified`
    // middleware, so a form here would only produce a 403. Say why
    // rather than rendering nothing.
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

  // Out of free contacts, no active pass: the backend already refused
  // this exact listing with a 402. Offer the pass instead of the form —
  // resubmitting the same message would just get refused again.
  if (isPaymentRequiredError(startConversation.error)) {
    return <MessagingPaywall />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const trimmed = body.trim()
    if (trimmed === '') return

    startConversation.mutate(
      { propertyId: property.id, body: trimmed },
      {
        // The thread may already exist — the backend does a
        // find-or-create — so we land on whichever one came back.
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
        Contacter le propriétaire
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Posez vos questions directement à {property.owner.name}.
      </p>
      <CreditsStatus />

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Textarea
          label="Votre message"
          rows={4}
          maxLength={2000}
          placeholder="Bonjour, ce logement est-il toujours disponible ?"
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
