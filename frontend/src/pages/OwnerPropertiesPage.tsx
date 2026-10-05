import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronLeft, ChevronRight, ImageOff, Pencil, Plus, TriangleAlert } from 'lucide-react'
import {
  useOwnerProperties,
  usePayPublicationFee,
  usePublishProperty,
  useUnpublishProperty,
} from '@/features/owner/useOwner'
import { useSettings } from '@/features/settings/useSettings'
import { usePaymentResult } from '@/hooks/usePaymentResult'
import { formatMad, formatPriceLabel, primaryPrice } from '@/lib/formatPrice'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Button, Card, EmptyState, Skeleton, buttonClasses, useToast } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import type { TFunction } from 'i18next'
import type { Property, PropertyStatusValue } from '@/types/property'

const STATUS_TONES: Record<PropertyStatusValue, BadgeTone> = {
  draft: 'slate',
  pending_review: 'amber',
  published: 'green',
  suspended: 'red',
  archived: 'slate',
}

/**
 * Does this listing still owe its publication fee?
 *
 * `requires_publication_fee` is computed by the backend
 * (Property::requiresPublicationFee()) - the rule (an owner's first
 * listing is free, every one after that owes the fee, whatever its
 * rental_type) is NOT duplicated here, so it can only ever change in
 * one place.
 */
function owesPublicationFee(property: Property): boolean {
  return property.requires_publication_fee && property.publication_status !== 'paid'
}

/**
 * The small grey line under a listing's title: "For sale" for a sale, then
 * the rooms that exist ("0 bedrooms" on a plot of land is noise, so a sale
 * only lists what is above zero). A rental always shows both, as before.
 */
function listingSummary(property: Property, t: TFunction): string {
  if (property.listing_type === 'sale') {
    const parts = [t('owner.properties.forSale')]
    if (property.bedrooms > 0) parts.push(t('card.bedrooms', { n: property.bedrooms }))
    if (property.bathrooms > 0) parts.push(t('card.bathrooms', { n: property.bathrooms }))
    return parts.join(' · ')
  }

  return `${t('card.bedrooms', { n: property.bedrooms })} · ${t('card.bathrooms', { n: property.bathrooms })}`
}

/**
 * /owner/properties - every property the current user owns, any status
 * (see EloquentPropertyRepository::paginateForOwner). Publish and
 * unpublish call the same endpoints as everywhere else (PropertyPolicy
 * checks ownership); a suspended property gets no publish button, since
 * only an admin can lift a suspension (PropertyService::publish()).
 *
 * An additional listing (Phase 29 - the owner's first is always free)
 * that has not paid its fee gets a "Payer" button instead of "Publier".
 * Clicking it LEAVES the app for the payment provider and comes back
 * here with ?payment=... - so there is no success toast at click time,
 * because at click time nothing has been paid yet. usePaymentResult
 * reports the real outcome on the way back.
 */
export default function OwnerPropertiesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  usePaymentResult()

  const { showToast } = useToast()
  const { data, isError, error } = useOwnerProperties(page)
  const { data: settings } = useSettings()
  const publishMutation = usePublishProperty()
  const unpublishMutation = useUnpublishProperty()
  const payFeeMutation = usePayPublicationFee()

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  function isMutating(property: Property) {
    return (
      (publishMutation.isPending && publishMutation.variables === property.id) ||
      (unpublishMutation.isPending && unpublishMutation.variables === property.id) ||
      (payFeeMutation.isPending && payFeeMutation.variables === property.id)
    )
  }

  /** The publish / unpublish / pay-the-fee control for one property. */
  function StatusAction({ property, compact }: { property: Property; compact?: boolean }) {
    if (property.status === 'suspended') {
      return (
        <span className="text-xs text-gray-400" title={t('owner.properties.suspendedHint')}>
          {compact ? t('owner.properties.suspendedShort') : t('owner.properties.suspendedByAdmin')}
        </span>
      )
    }

    if (property.status === 'published') {
      return (
        <Button
          size="sm"
          variant="secondary"
          disabled={isMutating(property)}
          onClick={() =>
            unpublishMutation.mutate(property.id, {
              onSuccess: () => showToast('success', t('owner.properties.unpublishedToast', { title: property.title })),
            })
          }
        >
          {isMutating(property) ? '...' : t('common.unpublish')}
        </Button>
      )
    }

    // Not published, and the fee is still owed: paying IS what publishes
    // it (PaymentService::markPublicationPaid), so there is no second
    // "Publier" click afterwards.
    if (owesPublicationFee(property)) {
      return (
        <Button
          size="sm"
          disabled={isMutating(property)}
          onClick={() =>
            payFeeMutation.mutate(property.id, {
              onSuccess: ({ redirectUrl }) => {
                // null means there was nothing to charge - the admin set
                // the fee to 0, the backend settled it and the listing
                // is already live. That is the only case we can claim
                // success at click time.
                if (redirectUrl === null) {
                  showToast('success', t('owner.properties.freePublishedToast', { title: property.title }))
                  return
                }

                // Full navigation, not a router push: the destination is
                // the payment provider, outside this app.
                window.location.href = redirectUrl
              },
            })
          }
        >
          {isMutating(property)
            ? '...'
            : settings
              ? t('owner.properties.pay', { amount: formatMad(settings.listing_publication_fee) })
              : t('owner.properties.payFees')}
        </Button>
      )
    }

    return (
      <Button
        size="sm"
        disabled={isMutating(property)}
        onClick={() =>
          publishMutation.mutate(property.id, {
            onSuccess: () => showToast('success', t('owner.properties.publishedToast', { title: property.title })),
          })
        }
      >
        {isMutating(property) ? '...' : t('common.publish')}
      </Button>
    )
  }

  function Thumb({ property }: { property: Property }) {
    const cover = property.images.find((image) => image.is_cover) ?? property.images[0] ?? null
    return (
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {cover ? (
          <img src={cover.url} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-gray-400">
            <ImageOff className="size-4" aria-hidden />
          </span>
        )}
      </div>
    )
  }

  const mutationError = publishMutation.error ?? unpublishMutation.error ?? payFeeMutation.error

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('owner.properties.title')}</h1>
          {data && (
            <p className="mt-1 text-sm text-gray-500">
              {t('owner.properties.count', { n: data.meta.total })}
            </p>
          )}
        </div>
        <Link to="/owner/properties/new" className={buttonClasses({ size: 'sm', className: 'lg:hidden' })}>
          <Plus className="size-4" aria-hidden />
          {t('common.add')}
        </Link>
      </div>

      {mutationError && (
        <Card className="mt-4 flex items-start gap-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {getErrorMessage(mutationError)}
        </Card>
      )}

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {getErrorMessage(error)}
          </Card>
        ) : !data ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-6" />}
            title={t('owner.properties.emptyTitle')}
            description={t('owner.properties.emptyDescription')}
            action={
              <Link to="/owner/properties/new" className={buttonClasses()}>
                <Plus className="size-4" aria-hidden />
                {t('owner.properties.addProperty')}
              </Link>
            }
          />
        ) : (
          <>
            {/* Desktop: a real table. Mobile: the same rows stacked as
                cards, because a 5-column table cannot shrink honestly. */}
            <Card className="hidden overflow-hidden p-0 lg:block">
              {/* table-fixed + fixed column widths: columns no longer size
                  themselves to their content, so a long title is truncated
                  with an ellipsis instead of widening the table and forcing
                  a horizontal scrollbar. */}
              <table className="w-full table-fixed">
                <colgroup>
                  <col />
                  <col className="w-28" />
                  <col className="w-36" />
                  <col className="w-32" />
                  <col className="w-40" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60">
                    {[
                      t('owner.properties.columnProperty'),
                      t('common.city'),
                      t('owner.properties.columnPrice'),
                      t('common.status'),
                      '',
                    ].map((heading, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((property) => {
                    const price = primaryPrice(property)
                    return (
                      <tr
                        key={property.id}
                        className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Thumb property={property} />
                            <div className="min-w-0">
                              <Link
                                to={`/properties/${property.id}`}
                                title={property.title}
                                className="block truncate font-medium text-gray-900 transition hover:text-brand-600"
                              >
                                {property.title}
                              </Link>
                              <p className="text-xs text-gray-500">{listingSummary(property, t)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="truncate px-4 py-3 text-sm text-gray-600">{property.city}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                          {price ? formatPriceLabel(price) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_TONES[property.status]}>
                            {t(`owner.properties.status.${property.status}`)}
                          </Badge>
                          {owesPublicationFee(property) && (
                            <p className="mt-1 text-[11px] font-medium text-amber-700">
                              {t('owner.properties.unpaid')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/owner/properties/${property.id}/edit`}
                              aria-label={t('owner.properties.editLabel', { title: property.title })}
                              title={t('common.edit')}
                              className={buttonClasses({
                                variant: 'secondary',
                                size: 'sm',
                                className: 'px-2.5',
                              })}
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Link>
                            <StatusAction property={property} compact />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            <div className="space-y-3 lg:hidden">
              {data.data.map((property) => {
                const price = primaryPrice(property)
                return (
                  <Card key={property.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Thumb property={property} />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/properties/${property.id}`}
                          className="block truncate font-medium text-gray-900"
                        >
                          {property.title}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {property.city}
                          {property.listing_type === 'sale' && ` · ${t('owner.properties.forSale')}`}
                        </p>
                        {price && <p className="text-sm text-gray-600">{formatPriceLabel(price)}</p>}
                      </div>
                      <div className="shrink-0 text-end">
                        <Badge tone={STATUS_TONES[property.status]}>
                          {t(`owner.properties.status.${property.status}`)}
                        </Badge>
                        {owesPublicationFee(property) && (
                          <p className="mt-1 text-[11px] font-medium text-amber-700">
                            {t('owner.properties.unpaidShort')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                      <Link
                        to={`/owner/properties/${property.id}/edit`}
                        className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                      >
                        <Pencil className="size-4" aria-hidden />
                        {t('common.edit')}
                      </Link>
                      <StatusAction property={property} />
                    </div>
                  </Card>
                )
              })}
            </div>

            {data.meta.last_page > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ChevronLeft className="size-4 rtl:rotate-180" />}
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  {t('properties.previous')}
                </Button>
                <span className="text-sm text-gray-500">
                  {t('properties.pageOf', { current: data.meta.current_page, last: data.meta.last_page })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= data.meta.last_page}
                  onClick={() => goToPage(page + 1)}
                >
                  {t('properties.next')}
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
