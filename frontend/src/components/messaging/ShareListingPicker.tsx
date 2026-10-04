import { useState } from 'react'
import { Home, Send, Share2, Users, X } from 'lucide-react'
import { useOwnerProperties } from '@/features/owner/useOwner'
import { useOwnRoommateListings } from '@/features/roommateListings/useRoommateListings'
import { formatMad } from '@/lib/formatPrice'
import { Button } from '@/components/ui'
import type { SharedListingAttachment } from '@/features/messaging/messagingApi'

/**
 * "Partager une annonce" — what the picker hands back to the composer.
 * `attachment` is exactly what sendMessage/startConversation need; the
 * rest is only for rendering the little preview chip before sending.
 */
export interface ShareableListing {
  key: string
  title: string
  priceLabel: string
  coverImageUrl: string | null
  attachment: SharedListingAttachment
}

function roommatePriceLabel(listing: {
  type: string
  price_per_person: string | null
  budget_min: string | null
  budget_max: string | null
}): string {
  if (listing.type === 'offer') {
    return listing.price_per_person ? `${formatMad(listing.price_per_person)} / mois` : ''
  }

  if (listing.budget_min && listing.budget_max) {
    return `${formatMad(listing.budget_min)} - ${formatMad(listing.budget_max)} / mois`
  }

  return listing.budget_min ? `À partir de ${formatMad(listing.budget_min)} / mois` : ''
}

/**
 * Inline toggle panel (no Modal/Popover primitive exists in this app) —
 * lets the sender attach ONE of their own published listings (property
 * or roommate post) to the next message. The backend re-checks ownership
 * and published status regardless of what is picked here (see
 * MessagingService::resolveSharedListing), so this list only needs to be
 * a reasonable default, never the source of truth.
 *
 * Deliberately shows BOTH properties and roommate posts: whoever is
 * chatting might own either kind, and nothing here says which one the
 * conversation is about.
 */
export default function ShareListingPicker({
  selected,
  onSelect,
  onClear,
  onSend,
  isSending = false,
}: {
  selected: ShareableListing | null
  onSelect: (listing: ShareableListing) => void
  onClear: () => void
  /**
   * Sends JUST the attached listing, right away — a separate action from
   * the composer's own "Envoyer" (which sends whatever text is typed,
   * plus this attachment if one is set). This is the dedicated "share it
   * now" path for someone who has nothing to type, only a listing to
   * hand over.
   */
  onSend: () => void
  isSending?: boolean
}) {
  const [open, setOpen] = useState(false)

  const { data: properties, isLoading: loadingProperties } = useOwnerProperties(1)
  const { data: roommateListings, isLoading: loadingRoommateListings } = useOwnRoommateListings(1)

  const publishedProperties = (properties?.data ?? []).filter((property) => property.status === 'published')
  const publishedRoommateListings = (roommateListings?.data ?? []).filter(
    (listing) => listing.status === 'published',
  )
  const isLoading = loadingProperties || loadingRoommateListings
  const hasAnything = publishedProperties.length > 0 || publishedRoommateListings.length > 0

  if (selected) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        {selected.coverImageUrl ? (
          <img
            src={selected.coverImageUrl}
            alt=""
            className="size-12 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-gray-200">
            <Home className="size-5 text-gray-400" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{selected.title}</p>
          {selected.priceLabel && <p className="text-xs text-gray-500">{selected.priceLabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            icon={<Send className="size-4" />}
            isLoading={isSending}
            onClick={onSend}
          >
            Envoyer l'annonce
          </Button>
          <Button type="button" size="sm" variant="ghost" icon={<X className="size-4" />} onClick={onClear}>
            Retirer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        icon={<Share2 className="size-4" />}
        onClick={() => setOpen((value) => !value)}
      >
        Partager une annonce
      </Button>

      {open && (
        <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
          {isLoading ? (
            <p className="p-2 text-sm text-gray-500">Chargement...</p>
          ) : !hasAnything ? (
            <p className="p-2 text-sm text-gray-500">
              Vous n'avez aucune annonce publiée à partager.
            </p>
          ) : (
            <>
              {publishedProperties.map((property) => {
                const cover = property.images.find((image) => image.is_cover) ?? property.images[0]
                // A sale has sale_price and no rental price.
                const priceLabel =
                  property.listing_type === 'sale'
                    ? property.sale_price
                      ? formatMad(property.sale_price)
                      : ''
                    : property.price_per_month
                      ? `${formatMad(property.price_per_month)} / mois`
                      : property.price_per_night
                        ? `${formatMad(property.price_per_night)} / nuit`
                        : ''

                return (
                  <button
                    key={`property-${property.id}`}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-gray-100"
                    onClick={() => {
                      onSelect({
                        key: `property-${property.id}`,
                        title: property.title,
                        priceLabel,
                        coverImageUrl: cover?.url ?? null,
                        attachment: { sharedPropertyId: property.id },
                      })
                      setOpen(false)
                    }}
                  >
                    {cover ? (
                      <img src={cover.url} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                        <Home className="size-4 text-gray-400" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{property.title}</p>
                      <p className="text-xs text-gray-500">{property.city}{priceLabel ? ` · ${priceLabel}` : ''}</p>
                    </div>
                  </button>
                )
              })}

              {publishedRoommateListings.map((listing) => {
                const cover = listing.images.find((image) => image.is_cover) ?? listing.images[0]
                const priceLabel = roommatePriceLabel(listing)

                return (
                  <button
                    key={`roommate-${listing.id}`}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-gray-100"
                    onClick={() => {
                      onSelect({
                        key: `roommate-${listing.id}`,
                        title: listing.title,
                        priceLabel,
                        coverImageUrl: cover?.url ?? null,
                        attachment: { sharedRoommateListingId: listing.id },
                      })
                      setOpen(false)
                    }}
                  >
                    {cover ? (
                      <img src={cover.url} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                        <Users className="size-4 text-gray-400" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{listing.title}</p>
                      <p className="text-xs text-gray-500">{listing.city}{priceLabel ? ` · ${priceLabel}` : ''}</p>
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
