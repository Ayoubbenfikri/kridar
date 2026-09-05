import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from './reviewsApi'
import type { ReplyToReviewPayload, SubmitReviewPayload } from './reviewsApi'

export function usePropertyReviews(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['properties', propertyId, 'reviews'],
    queryFn: () => reviewsApi.fetchReviewsForProperty(propertyId as string),
    enabled: propertyId !== undefined,
  })
}

/**
 * Invalidating the whole 'properties' branch (not just this one review
 * list) also refreshes the property's average_rating/reviews_count and
 * the listing grid, wherever they're currently cached.
 */
export function useSubmitReview(reservationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) => reviewsApi.submitReview(reservationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useReplyToReview(reviewId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReplyToReviewPayload) => reviewsApi.replyToReview(reviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}
