import type { TFunction } from 'i18next'
import type { NotificationData } from '@/types/notification'

/**
 * The sentence shown for one notification, in the CURRENT language.
 *
 * The backend writes a French `message` into every notification when it is
 * created, so it can never follow the language the reader picks later.
 * Every notification also carries its `type` and the values that sentence
 * was built from (listing title, sender, rating), so we rebuild it here
 * from those.
 *
 * Anything we cannot rebuild keeps the stored French text: an unknown
 * type, a missing field, or a cancellation saved before `cancelled_by`
 * existed. An old notification in French is better than a broken one.
 */
export function notificationText(data: NotificationData, t: TFunction): string {
  const title = data.property_title
  if (!title) return data.message

  switch (data.type) {
    case 'new_message':
      return data.sender_name
        ? t('notifications.message.new_message', { sender: data.sender_name, title })
        : data.message

    case 'reservation_cancelled':
      return data.cancelled_by
        ? t(`notifications.message.reservation_cancelled_by_${data.cancelled_by}`, { title })
        : data.message

    case 'review_submitted':
      return data.rating !== undefined
        ? t('notifications.message.review_submitted', { rating: data.rating, title })
        : data.message

    case 'reservation_requested':
    case 'reservation_confirmed':
    case 'reservation_rejected':
    case 'review_replied':
      return t(`notifications.message.${data.type}`, { title })

    default:
      return data.message
  }
}
