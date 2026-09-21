import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Send, TriangleAlert } from 'lucide-react'
import {
  useConversation,
  useMarkConversationRead,
  useSendMessage,
} from '@/features/messaging/useMessaging'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { Button, Card, Skeleton, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Message } from '@/types/conversation'

function formatSentAt(value: string): string {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Bubble({ message }: { message: Message }) {
  return (
    <div className={cn('flex', message.is_mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          message.is_mine
            ? 'rounded-br-md bg-brand-600 text-white'
            : 'rounded-bl-md bg-gray-100 text-gray-900',
        )}
      >
        <p className="text-[15px] whitespace-pre-line">{message.body}</p>
        <p className={cn('mt-1 text-[11px]', message.is_mine ? 'text-brand-100' : 'text-gray-400')}>
          {formatSentAt(message.created_at)}
        </p>
      </div>
    </div>
  )
}

/**
 * /messages/:id — one thread.
 *
 * Polls every 10s (see useConversation), so the other side's replies
 * appear on their own. The API returns messages NEWEST FIRST so that
 * page 1 is the bottom of the thread; they are reversed here for
 * display, oldest at the top like any chat.
 */
export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isError, error } = useConversation(id)

  const conversationId = data?.conversation.id
  const sendMessage = useSendMessage(conversationId ?? 0)
  const markRead = useMarkConversationRead()

  const [body, setBody] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mark read once per thread. A ref rather than state: this must not
  // re-render, and it must not fire again when polling brings the same
  // conversation back a second later.
  const markedReadFor = useRef<number | null>(null)

  useEffect(() => {
    if (conversationId === undefined) return
    if (markedReadFor.current === conversationId) return

    markedReadFor.current = conversationId
    markRead.mutate(conversationId)
    // markRead is a stable mutation object; including it would re-run
    // this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  const messages = data ? [...data.messages].reverse() : []
  const messageCount = messages.length

  // Jump to the newest message when the thread loads or grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messageCount])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const trimmed = body.trim()
    if (trimmed === '' || conversationId === undefined) return

    sendMessage.mutate(trimmed, {
      // Clear only once the server has it — otherwise a failed send
      // silently eats what the user typed.
      onSuccess: () => setBody(''),
    })
  }

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          {getErrorMessage(error)}
        </Card>
        <Link
          to="/messages"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour aux messages
        </Link>
      </main>
    )
  }

  const validationErrors = getValidationErrors(sendMessage.error)

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to="/messages"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux messages
      </Link>

      {!data ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <Card className="mt-4 p-4">
            <p className="font-semibold text-gray-900">
              {data.conversation.counterpart?.name ?? 'Utilisateur'}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {data.conversation.property.id !== null ? (
                <Link
                  to={`/properties/${data.conversation.property.id}`}
                  className="transition hover:text-brand-600"
                >
                  {data.conversation.property.title}
                </Link>
              ) : (
                'Annonce supprimée'
              )}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {data.conversation.viewer_is_owner
                ? 'Cette personne vous a contacté à propos de votre annonce'
                : 'Vous avez contacté le propriétaire'}
            </p>
          </Card>

          <Card className="mt-4 p-4">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Aucun message.</p>
            ) : (
              <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <Bubble key={message.id} message={message} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}

            {data.meta.last_page > 1 && (
              <p className="mt-3 border-t border-gray-100 pt-3 text-center text-xs text-gray-400">
                Seuls les {data.meta.per_page} derniers messages sont affichés.
              </p>
            )}
          </Card>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <Textarea
              label="Votre message"
              rows={3}
              maxLength={2000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              error={validationErrors?.body?.[0]}
              hint={`${body.length} / 2000`}
            />

            {sendMessage.isError && !validationErrors && (
              <p className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {getErrorMessage(sendMessage.error)}
              </p>
            )}

            <Button
              type="submit"
              icon={<Send className="size-4" />}
              disabled={body.trim() === ''}
              isLoading={sendMessage.isPending}
            >
              {sendMessage.isPending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </form>
        </>
      )}
    </main>
  )
}
