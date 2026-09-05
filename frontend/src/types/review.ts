/**
 * Mirrors backend App\Http\Resources\ReviewResource exactly (see
 * routes/api/reviews.php).
 */
export interface ReviewGuest {
  id: number
  name: string
}

export interface Review {
  id: number
  reservation_id: number
  property_id: number
  rating: number
  comment: string
  owner_reply: string | null
  owner_replied_at: string | null
  guest: ReviewGuest
  created_at: string
}
