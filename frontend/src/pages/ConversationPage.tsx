import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Home,
  MoreVertical,
  Pencil,
  Send,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react'
import {
  useConversation,
  useDeleteMessage,
  useEditMessage,
  useMarkConversationRead,
  useSendMessage,
} from '@/features/messaging/useMessaging'
import { getErrorMessage, getValidationErrors } from '@/lib/apiErrors'
import { formatMad } from '@/lib/formatPrice'
import ShareListingPicker from '@/components/messaging/ShareListingPicker'
import type { ShareableListing } from '@/components/messaging/ShareListingPicker'
import { Button, Card, Skeleton, Textarea, UserAvatar, useToast } from '@/components/ui'
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

// Matches an http(s) URL up to the next whitespace. Good enough for
// "I pasted my listing's page from the address bar" — this app has no
// rich-text composer, so a plain pattern match is all a message body
// can ever contain anyway.
const URL_PATTERN = /(https?:\/\/[^\s]+)/g

/**
 * Turns any http(s) URL inside a message into a clickable link.
 * Added so the owner-initiated flow (OwnerReservationsPage's "Contacter"
 * button, or anyone pasting a listing's link) actually lets the other
 * side open it — message bodies are plain text otherwise, so a pasted
 * URL just sat there unclickable. Opens in a new tab: a chat is not
 * somewhere you want to navigate away from.
 */
function linkifyMessage(body: string): ReactNode[] {
  return body.split(URL_PATTERN).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

/**
 * "Partager une annonce" preview — shown above the text when a message
 * carries one. Always a plain white card regardless of which side sent
 * it (the bubble itself is blue or gray): a photo + price reads fine on
 * either background, and it keeps this from needing two color variants.
 */
function SharedListingCard({ message }: { message: Message }) {
  if (message.shared_property) {
    const listing = message.shared_property
    const priceLabel = listing.price_per_month
      ? `${formatMad(listing.price_per_month)} / mois`
      : listing.price_per_night
        ? `${formatMad(listing.price_per_night)} / nuit`
        : null

    return (
      <Link
        to={`/properties/${listing.id}`}
        className="mb-2 flex items-center gap-2.5 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-gray-900 transition hover:bg-gray-50"
      >
        {listing.cover_image_url ? (
          <img src={listing.cover_image_url} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Home className="size-4.5 text-gray-400" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{listing.title}</p>
          <p className="text-xs text-gray-500">
            {listing.city}
            {priceLabel ? ` · ${priceLabel}` : ''}
          </p>
        </div>
      </Link>
    )
  }

  if (message.shared_roommate_listing) {
    const listing = message.shared_roommate_listing
    const priceLabel =
      listing.type === 'offer'
        ? listing.price_per_person
          ? `${formatMad(listing.price_per_person)} / mois`
          : null
        : listing.budget_min && listing.budget_max
          ? `${formatMad(listing.budget_min)} - ${formatMad(listing.budget_max)} / mois`
          : null

    return (
      <Link
        to={`/roommates/${listing.id}`}
        className="mb-2 flex items-center gap-2.5 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-gray-900 transition hover:bg-gray-50"
      >
        {listing.cover_image_url ? (
          <img src={listing.cover_image_url} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Users className="size-4.5 text-gray-400" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{listing.title}</p>
          <p className="text-xs text-gray-500">
            {listing.city}
            {priceLabel ? ` · ${priceLabel}` : ''}
          </p>
        </div>
      </Link>
    )
  }

  return null
}

/**
 * One bubble. Edit mode is driven from ConversationPage (editingMessageId)
 * rather than kept local to this component, so starting a new edit always
 * closes whichever other bubble was open — a chat only ever has one
 * message being edited at a time.
 */
function Bubble({
  message,
  isEditing,
  isSaving,
  isDeleting,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  message: Message
  isEditing: boolean
  isSaving: boolean
  isDeleting: boolean
  onStartEdit: (messageId: number) => void
  onCancelEdit: () => void
  onSaveEdit: (messageId: number, body: string) => void
  onDelete: (messageId: number) => void
}) {
  const [draft, setDraft] = useState(message.body ?? '')

  // Refill the draft from the current body every time edit mode opens
  // for THIS message — not on every render, otherwise it would wipe out
  // what the user is typing.
  useEffect(() => {
    if (isEditing) setDraft(message.body ?? '')
  }, [isEditing, message.body])

  // The "..." menu (Modifier / Supprimer). Hover-only icons were hard to
  // notice, so this button is always visible instead; the two actions
  // live behind it rather than as two separate always-visible icons, to
  // keep the bubble from feeling cluttered.
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const canModify = message.is_mine && !message.is_deleted

  function handleSave() {
    const trimmed = draft.trim()
    if (trimmed === '') return
    onSaveEdit(message.id, trimmed)
  }

  function handleDeleteClick() {
    // No reusable confirm modal exists yet in this app, and deleting a
    // message is not frequent enough to justify building one just for
    // this — a native confirm is fine here.
    if (window.confirm('Supprimer ce message ? Cette action est définitive.')) {
      onDelete(message.id)
    }
  }

  return (
    <div className={cn('flex items-end gap-2', message.is_mine ? 'justify-end' : 'justify-start')}>
      {/* Only on the OTHER side's messages — you already know what you
          look like, same convention as WhatsApp/Messenger. */}
      {!message.is_mine && (
        <UserAvatar
          name={message.sender.name}
          avatarUrl={message.sender.avatar_url}
          seed={message.sender.id}
          size="xs"
        />
      )}
      <div
        className={cn(
          'relative max-w-[80%] rounded-2xl px-4 py-2.5',
          message.is_mine
            ? 'rounded-br-md bg-brand-600 text-white'
            : 'rounded-bl-md bg-gray-100 text-gray-900',
        )}
      >
        {message.is_deleted ? (
          <p
            className={cn(
              'text-[15px] italic',
              message.is_mine ? 'text-brand-100' : 'text-gray-400',
            )}
          >
            Message supprimé
          </p>
        ) : (
          <>
            <SharedListingCard message={message} />

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  rows={2}
                  maxLength={2000}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className={cn(
                    'w-full resize-none rounded-lg border px-2 py-1.5 text-[15px] outline-none',
                    message.is_mine
                      ? 'border-white/30 bg-white/10 text-white placeholder:text-brand-100'
                      : 'border-gray-300 bg-white text-gray-900',
                  )}
                />
                <div className="flex gap-3 text-xs font-medium">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || draft.trim() === ''}
                    className="underline disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={isSaving}
                    className="underline disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[15px] break-words whitespace-pre-line">
                {linkifyMessage(message.body ?? '')}
              </p>
            )}
          </>
        )}

        <div className="mt-1 flex items-center gap-2">
          <p className={cn('text-[11px]', message.is_mine ? 'text-brand-100' : 'text-gray-400')}>
            {formatSentAt(message.created_at)}
            {message.edited_at ? ' · modifié' : ''}
          </p>

          {canModify && !isEditing && (
            <div ref={menuRef} className="relative ml-auto">
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-label="Options du message"
                className={cn(
                  'rounded p-0.5 hover:opacity-70',
                  message.is_mine ? 'text-brand-100' : 'text-gray-400',
                )}
              >
                <MoreVertical className="size-3.5" aria-hidden />
              </button>

              {isMenuOpen && (
                // Always dark-on-white regardless of bubble color, same
                // reasoning as SharedListingCard above — easier to read
                // than trying to theme a dropdown for both bubble colors.
                <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onStartEdit(message.id)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleDeleteClick()
                    }}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
  const editMessage = useEditMessage(conversationId ?? 0)
  const deleteMessage = useDeleteMessage(conversationId ?? 0)
  const markRead = useMarkConversationRead()
  const { showToast } = useToast()

  const [body, setBody] = useState('')
  const [sharedListing, setSharedListing] = useState<ShareableListing | null>(null)
  // Only one message can be in edit mode at a time — see Bubble's comment.
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
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

    sendMessage.mutate(
      { body: trimmed, shared: sharedListing?.attachment },
      {
        // Clear only once the server has it — otherwise a failed send
        // silently eats what the user typed.
        onSuccess: () => {
          setBody('')
          setSharedListing(null)
        },
      },
    )
  }

  function handleSaveEdit(messageId: number, newBody: string) {
    editMessage.mutate(
      { messageId, body: newBody },
      {
        onSuccess: () => setEditingMessageId(null),
        onError: (mutationError) => showToast('error', getErrorMessage(mutationError)),
      },
    )
  }

  function handleDeleteMessage(messageId: number) {
    deleteMessage.mutate(messageId, {
      onError: (mutationError) => showToast('error', getErrorMessage(mutationError)),
    })
  }

  /**
   * "Envoyer l'annonce" — the picker's own dedicated button. Separate
   * from handleSubmit() above: this sends the listing right away with no
   * text required, rather than needing something typed in the Textarea
   * first. The backend still needs a non-empty body (messages.body is
   * NOT NULL), so a short default caption is sent along with it.
   */
  function sendSharedListing() {
    if (conversationId === undefined || !sharedListing) return

    sendMessage.mutate(
      { body: `Annonce partagée : ${sharedListing.title}`, shared: sharedListing.attachment },
      { onSuccess: () => setSharedListing(null) },
    )
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
          <Card className="mt-4 flex items-center gap-3 p-4">
            <UserAvatar
              name={data.conversation.counterpart?.name}
              avatarUrl={data.conversation.counterpart?.avatar_url}
              seed={data.conversation.counterpart?.id ?? data.conversation.id}
              size="sm"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">
                {data.conversation.counterpart?.name ?? 'Utilisateur'}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {/* Phase R2 (roommate listings) — same listing_type branch
                    as MessagesPage's ConversationRow, plus the right link
                    target for each kind. */}
                {data.conversation.listing_type === 'roommate_listing' ? (
                  data.conversation.roommate_listing.id !== null ? (
                    <Link
                      to={`/roommates/${data.conversation.roommate_listing.id}`}
                      className="transition hover:text-brand-600"
                    >
                      {data.conversation.roommate_listing.title}
                    </Link>
                  ) : (
                    'Annonce supprimée'
                  )
                ) : data.conversation.property.id !== null ? (
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
            </div>
          </Card>

          <Card className="mt-4 p-4">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Aucun message.</p>
            ) : (
              <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <Bubble
                    key={message.id}
                    message={message}
                    isEditing={editingMessageId === message.id}
                    isSaving={editMessage.isPending && editingMessageId === message.id}
                    isDeleting={deleteMessage.isPending && deleteMessage.variables === message.id}
                    onStartEdit={setEditingMessageId}
                    onCancelEdit={() => setEditingMessageId(null)}
                    onSaveEdit={handleSaveEdit}
                    onDelete={handleDeleteMessage}
                  />
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
            <ShareListingPicker
              selected={sharedListing}
              onSelect={setSharedListing}
              onClear={() => setSharedListing(null)}
              onSend={sendSharedListing}
              isSending={sendMessage.isPending}
            />

            <Textarea
              label="Votre message"
              rows={3}
              maxLength={2000}
              placeholder="Écrivez votre message..."
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
