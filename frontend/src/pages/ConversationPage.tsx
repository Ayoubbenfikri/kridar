import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Home,
  Loader2,
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
import { Card, Skeleton, UserAvatar, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { track } from '@/lib/analytics'
import type { SharedListingAttachment } from '@/features/messaging/messagingApi'
import type { Message } from '@/types/conversation'

/**
 * Admin analytics (Phase A3): a listing card was sent in a conversation.
 * Called once the message is really sent, never on picking alone.
 */
function trackShare(attachment: SharedListingAttachment | undefined): void {
  if (attachment?.sharedPropertyId) {
    track('share_click', { property_id: attachment.sharedPropertyId })
  } else if (attachment?.sharedRoommateListingId) {
    track('share_click', { roommate_listing_id: attachment.sharedRoommateListingId })
  }
}

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
    // A sale carries sale_price and no rental price (both null).
    const priceLabel =
      listing.listing_type === 'sale'
        ? listing.sale_price
          ? formatMad(listing.sale_price)
          : null
        : listing.price_per_month
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
  isFirstInGroup,
  isEditing,
  isSaving,
  isDeleting,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  message: Message
  /** True for the first message of a run from the same sender — that's
      the only one that gets an avatar and a name label above it, same
      "group consecutive messages" convention as WhatsApp/Messenger. */
  isFirstInGroup: boolean
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
    <div className={cn(isFirstInGroup ? 'mt-3' : 'mt-1', 'first:mt-0')}>
      {/* Sender name, once per group - shown above the first bubble of a
          run of consecutive messages from the same person. ml-9 lines it
          up with the bubble below (xs avatar is 28px + 8px gap = 36px). */}
      {isFirstInGroup && !message.is_mine && (
        <p className="mb-1 ml-9 text-xs font-medium text-gray-400">
          {message.sender.name ?? 'Utilisateur'}
        </p>
      )}

      <div className={cn('flex items-end gap-2', message.is_mine ? 'justify-end' : 'justify-start')}>
        {/* Only on the OTHER side's messages — you already know what you
            look like, same convention as WhatsApp/Messenger. Only on the
            first bubble of a group; the rest get an invisible spacer of
            the same width so they still line up under it. */}
        {!message.is_mine &&
          (isFirstInGroup ? (
            <UserAvatar
              name={message.sender.name}
              avatarUrl={message.sender.avatar_url}
              seed={message.sender.id}
              size="xs"
            />
          ) : (
            <div className="size-7 shrink-0" aria-hidden />
          ))}
        <div
          className={cn(
            // A literal pill (rounded-full) only looks right for a short
            // one-line message - its radius is min(width,height)/2, so a
            // tall bubble (a shared-listing card + caption) got hugely
            // over-curved corners. A fixed radius stays soft either way.
            'relative max-w-[80%] rounded-[20px] px-4 py-2.5',
            message.is_mine ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-900',
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
    </div>
  )
}

/**
 * /messages/:id — one thread, rendered as the right-hand panel of
 * MessagesPage's split view (that file mounts this through <Outlet />;
 * it is never routed to on its own anymore). No outer page chrome here —
 * the shared bordered panel and the conversation list beside it both
 * live in MessagesPage, this component just fills its half.
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

  // Separate from handleSubmit so the composer's textarea can trigger the
  // same send on Enter (see its onKeyDown) without faking a FormEvent.
  function trySend() {
    const trimmed = body.trim()
    if (trimmed === '' || conversationId === undefined) return

    sendMessage.mutate(
      { body: trimmed, shared: sharedListing?.attachment },
      {
        // Clear only once the server has it — otherwise a failed send
        // silently eats what the user typed.
        onSuccess: () => {
          trackShare(sharedListing?.attachment)
          setBody('')
          setSharedListing(null)
        },
      },
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    trySend()
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
   * text required, rather than needing something typed in the composer
   * first. The backend still needs a non-empty body (messages.body is
   * NOT NULL), so a short default caption is sent along with it.
   */
  function sendSharedListing() {
    if (conversationId === undefined || !sharedListing) return

    sendMessage.mutate(
      { body: `Annonce partagée : ${sharedListing.title}`, shared: sharedListing.attachment },
      {
        onSuccess: () => {
          trackShare(sharedListing.attachment)
          setSharedListing(null)
        },
      },
    )
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          {getErrorMessage(error)}
        </Card>
        <Link
          to="/messages"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600 md:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour aux messages
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-64 flex-1 rounded-xl" />
      </div>
    )
  }

  const validationErrors = getValidationErrors(sendMessage.error)

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header — the back arrow only shows on mobile: on md+ the thread
          sits next to the conversation list (MessagesPage), so there is
          nothing to "go back" to, the list is already right there. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 p-4">
        <Link
          to="/messages"
          aria-label="Retour aux messages"
          className="shrink-0 text-gray-400 transition hover:text-gray-600 md:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>

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
          <p className="mt-0.5 truncate text-sm text-gray-500">
            {/* Phase R2 (roommate listings) — same listing_type branch
                as ConversationListPanel's ConversationRow, plus the
                right link target for each kind. */}
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
        </div>
      </div>

      {/* Messages — the only scrollable region, fills whatever height is
          left between the header and the composer (min-h-0 is what lets
          a flex child actually shrink and scroll instead of overflowing
          the whole panel). */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Aucun message.</p>
        ) : (
          <>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null
              // A new group starts whenever the sender changes (or the
              // side changes - is_mine covers the case where the
              // other person's own id briefly matches a stale cache).
              const isFirstInGroup =
                !previousMessage ||
                previousMessage.sender.id !== message.sender.id ||
                previousMessage.is_mine !== message.is_mine

              return (
                <Bubble
                  key={message.id}
                  message={message}
                  isFirstInGroup={isFirstInGroup}
                  isEditing={editingMessageId === message.id}
                  isSaving={editMessage.isPending && editingMessageId === message.id}
                  isDeleting={deleteMessage.isPending && deleteMessage.variables === message.id}
                  onStartEdit={setEditingMessageId}
                  onCancelEdit={() => setEditingMessageId(null)}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDeleteMessage}
                />
              )
            })}
            <div ref={bottomRef} />
          </>
        )}

        {data.meta.last_page > 1 && (
          <p className="mt-3 border-t border-gray-100 pt-3 text-center text-xs text-gray-400">
            Seuls les {data.meta.per_page} derniers messages sont affichés.
          </p>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="shrink-0 space-y-3 border-t border-gray-200 p-4">
        <ShareListingPicker
          selected={sharedListing}
          onSelect={setSharedListing}
          onClear={() => setSharedListing(null)}
          onSend={sendSharedListing}
          isSending={sendMessage.isPending}
        />

        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            maxLength={2000}
            placeholder="Écrivez votre message..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter inserts a line break - same
              // convention as every chat app this page is modeled on.
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                trySend()
              }
            }}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-full border border-transparent bg-gray-100 px-4 py-2.5 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-400 focus:bg-white"
          />

          <button
            type="submit"
            disabled={body.trim() === '' || sendMessage.isPending}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-brand-700 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
          >
            {sendMessage.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            Envoyer
          </button>
        </div>

        {validationErrors?.body?.[0] && (
          <p className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {validationErrors.body[0]}
          </p>
        )}

        {sendMessage.isError && !validationErrors && (
          <p className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {getErrorMessage(sendMessage.error)}
          </p>
        )}
      </form>
    </div>
  )
}
