import axiosClient from '@/api/axiosClient'
import type { PaginatedResponse } from '@/types/property'
import type { Review } from '@/types/review'

async function fetchReviewsForProperty(propertyId: number | string): Promise<PaginatedResponse<Review>> {
  const { data } = await axiosClient.get<PaginatedResponse<Review>>(`/api/v1/properties/${propertyId}/reviews`)
  return data
}

export interface SubmitReviewPayload {
  rating: number
  comment: string
}

async function submitReview(reservationId: number | string, payload: SubmitReviewPayload): Promise<Review> {
  const { data } = await axiosClient.post<{ review: Review }>(
    `/api/v1/reservations/${reservationId}/review`,
    payload,
  )
  return data.review
}

export interface ReplyToReviewPayload {
  owner_reply: string
}

async function replyToReview(reviewId: number | string, payload: ReplyToReviewPayload): Promise<Review> {
  const { data } = await axiosClient.patch<{ review: Review }>(`/api/v1/reviews/${reviewId}`, payload)
  return data.review
}

export const reviewsApi = {
  fetchReviewsForProperty,
  submitReview,
  replyToReview,
}
