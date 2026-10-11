/**
 * "Where to go after logging in" (Phase O1 - owner UX).
 *
 * A protected page sends a logged-out visitor to /login?redirect=/the/page,
 * and the login, register and Google flows send them back there. Without
 * this, an owner who clicked "Publish my property" on an ad was dropped on
 * the home page after signing up and had to find the button again.
 *
 * The value comes from the URL, so anyone can craft it: only a path on
 * THIS site is accepted. "//evil.com" (protocol-relative) and
 * "https://evil.com" would otherwise turn Krihouse's login page into a
 * link that forwards people to a phishing site (an "open redirect").
 * GoogleAuthController applies the same rule on the backend.
 */
export const REDIRECT_PARAM = 'redirect'

/** The owner journey most ads point at. */
export const OWNER_START_PATH = '/owner/properties/new'

export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback

  // A single leading slash, then no second slash or backslash right after
  // it (browsers treat "/\evil.com" like "//evil.com"), and nothing that
  // could smuggle a scheme or control characters in.
  if (!/^\/(?![/\\])[A-Za-z0-9\-._~/?=&%]*$/.test(value)) return fallback

  // Never send someone back to an auth page: they would loop.
  if (/^\/(login|register)(\/|\?|$)/.test(value)) return fallback

  return value
}

/** "/login?redirect=%2Fowner%2Fproperties%2Fnew", or plain "/login" for "/". */
export function withRedirect(authPath: '/login' | '/register', target: string | null | undefined): string {
  const safe = safeRedirect(target, '')
  return safe && safe !== '/' ? `${authPath}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}` : authPath
}
