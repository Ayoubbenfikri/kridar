/**
 * Mirrors backend App\Http\Resources\NotificationResource. `data` is
 * whatever the specific App\Notifications\* class's toArray() put
 * there - every one of them includes `type` and a French `message`
 * (kept as a fallback), plus a few related ids depending on the type.
 * The page does NOT show `message`: it builds the sentence itself from
 * `type` + the fields below, in the current language
 * (lib/notificationMessage.ts).
 */
export type NotificationType =
  | 'new_message'
  | 'reservation_requested'
  | 'reservation_confirmed'
  | 'reservation_rejected'
  | 'reservation_cancelled'
  | 'review_submitted'
  | 'review_replied'

export interface NotificationData {
  type: NotificationType
  message: string
  reservation_id?: number
  property_id?: number
  property_title?: string
  review_id?: number
  rating?: number
  /** new_message: who wrote. */
  sender_name?: string
  /** reservation_cancelled: which side cancelled (absent on older rows). */
  cancelled_by?: 'guest' | 'owner'
}

// Named AppNotification, not Notification - that name is already taken
// by the browser's built-in Notification API type.
export interface AppNotification {
  id: string
  data: NotificationData
  read_at: string | null
  created_at: string
}
