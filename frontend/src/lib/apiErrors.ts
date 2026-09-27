import { isAxiosError } from 'axios'

export type ValidationErrors = Record<string, string[]>

/**
 * Laravel's validation error response shape:
 * { message: "...", errors: { field: ["msg1", "msg2"] } }
 * Returns null when the error isn't a 422 validation error.
 */
export function getValidationErrors(error: unknown): ValidationErrors | null {
  if (isAxiosError(error) && error.response?.status === 422) {
    return (error.response.data?.errors as ValidationErrors) ?? null
  }
  return null
}

/**
 * A single human-readable message for any API error - the backend's
 * "message" field when there is one, a generic fallback otherwise.
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message
  }
  return 'Une erreur est survenue. Reessaie.'
}

/**
 * 402 Payment Required — the request is well-formed, the user is just
 * out of something they need to pay for. Phase 29 (monetization
 * overhaul): MessagingCreditsExhaustedException uses this status
 * specifically so the frontend can tell "buy a pack" apart from a
 * generic failure, same convention as PublicationFeeRequiredException.
 */
export function isPaymentRequiredError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 402
}
