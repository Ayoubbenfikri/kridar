import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, LogIn, MailWarning, MessageSquare, Send } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useStartConversation } from '@/features/messaging/useMessaging'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Textarea, buttonClasses } from '@/components/ui'
import type { Property } from '@/types/property'

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

  return (
    <Card className="mt-4 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <MessageSquare className="size-4.5 text-brand-600" aria-hidden />
        Contacter le propriétaire
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Posez vos questions directement à {property.owner.name}.
      </p>

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

        {startConversation.isError && !validationErrors && (
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
