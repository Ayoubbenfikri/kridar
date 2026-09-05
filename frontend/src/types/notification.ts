/**
 * Mirrors backend App\Http\Resources\NotificationResource. `data` is
 * whatever the specific App\Notifications\* class's toArray() put
 * there - every one of them includes `type` and a ready-to-display
 * French `message`, plus a few related ids depending on the type.
 */
export type NotificationType =
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
}

// Named AppNotification, not Notification - that name is already taken
// by the browser's built-in Notification API type.
export interface AppNotification {
  id: string
  data: NotificationData
  read_at: string | null
  created_at: string
}
