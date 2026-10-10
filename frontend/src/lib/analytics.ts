import { useEffect } from 'react'
import i18n from '@/i18n'

/**
 * Admin analytics (Phase A3) - the browser side.
 *
 * Sends "what happened, on which page" to POST /api/v1/analytics/collect.
 * Everything else (who the visitor is, which device, which language...)
 * is worked out by the server: see backend AnalyticsService. Nothing is
 * stored in the browser to identify anyone - no cookie, no id (only a
 * per-tab "landing page already sent" flag, see ENTRY_KEY).
 *
 * Rules for every call in this file:
 *   - fire-and-forget: tracking must NEVER slow down, break or show an
 *     error in the app. Every failure is swallowed on purpose;
 *   - admin pages are never tracked (the backend also ignores admins).
 */

/** Mirrors backend App\Enums\AnalyticsEventName. */
export type AnalyticsEventName =
  | 'page_view'
  | 'listing_view'
  | 'roommate_view'
  | 'search'
  | 'contact_click'
  | 'phone_reveal_click'
  | 'booking_request'
  | 'favorite_add'
  | 'share_click'
  | 'register'
  | 'google_login_click'
  | 'support_click'

export interface AnalyticsData {
  property_id?: number
  roommate_listing_id?: number
}

interface CollectBody extends AnalyticsData {
  name: AnalyticsEventName
  path: string
  is_entry?: boolean
  referrer?: string
  utm_source?: string
}

const COLLECT_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/analytics/collect`

/** Same event twice within this delay = one event (double click, React StrictMode). */
const DUPLICATE_WINDOW_MS = 1000

let lastKey = ''
let lastSentAt = 0

/**
 * Has this TAB already sent its landing page? Kept in sessionStorage so
 * a refresh (F5) or coming back from Google sign-in does not count as a
 * brand-new visit. It is a plain "1" flag, not an id: sessionStorage is
 * per tab and wiped when the tab closes, and nothing in it identifies
 * the visitor. A module variable backs it up when storage is blocked.
 */
const ENTRY_KEY = 'krihouse.analytics.entry'
let entrySentInMemory = false

function entryAlreadySent(): boolean {
  try {
    return entrySentInMemory || sessionStorage.getItem(ENTRY_KEY) === '1'
  } catch {
    return entrySentInMemory
  }
}

function markEntrySent(): void {
  entrySentInMemory = true
  try {
    sessionStorage.setItem(ENTRY_KEY, '1')
  } catch {
    // Private mode / blocked storage: the in-memory flag is enough.
  }
}

let lastPagePath = ''
let lastPageAt = 0

function send(body: CollectBody): void {
  if (body.path.startsWith('/admin')) return

  const key = JSON.stringify(body)
  const now = Date.now()
  if (key === lastKey && now - lastSentAt < DUPLICATE_WINDOW_MS) return
  lastKey = key
  lastSentAt = now

  try {
    // fetch + keepalive rather than axios: the request still leaves when
    // the click itself navigates away (Google sign-in, a PayPal link...),
    // which an ordinary request would be cancelled by.
    void fetch(COLLECT_URL, {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Same as axiosClient: the backend stores the interface language.
        'Accept-Language': i18n.language,
      },
      body: JSON.stringify(body),
    }).catch(() => {
      // Ignored on purpose - see the rules at the top of this file.
    })
  } catch {
    // Same: an old browser without fetch/keepalive just isn't counted.
  }
}

/**
 * Records an action on the current page.
 *
 *   track('contact_click', { property_id: property.id })
 */
export function track(name: Exclude<AnalyticsEventName, 'page_view'>, data: AnalyticsData = {}): void {
  send({ name, path: window.location.pathname, ...data })
}

/**
 * Records a page view. The FIRST one of the tab is the landing page: it
 * also says where the visitor came from (the previous site and an ad's
 * utm_source). Later pages don't - in a single-page app document.referrer
 * never changes, so repeating it would count one Google visit ten times.
 */
function trackPageView(path: string): void {
  // The same page twice in a row within a second is one view. Checked on
  // the path alone, before the entry fields are added: in development
  // React StrictMode runs every effect twice, and the second call would
  // otherwise look different (no is_entry) and slip past send()'s check.
  const now = Date.now()
  if (path === lastPagePath && now - lastPageAt < DUPLICATE_WINDOW_MS) return
  lastPagePath = path
  lastPageAt = now

  const body: CollectBody = { name: 'page_view', path }

  if (!entryAlreadySent()) {
    markEntrySent()
    body.is_entry = true

    if (document.referrer) {
      body.referrer = document.referrer.slice(0, 2048)
    }

    // Same rule as the backend validation: anything else is dropped here
    // rather than making the whole page view fail with a 422.
    const utmSource = new URLSearchParams(window.location.search).get('utm_source')
    if (utmSource && /^[A-Za-z0-9._-]{1,50}$/.test(utmSource)) {
      body.utm_source = utmSource
    }
  }

  send(body)
}

/** Sends a page view every time the route changes. Used once, in AppLayout. */
export function usePageViewTracking(pathname: string): void {
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])
}

/**
 * Sends listing_view / roommate_view once the listing has loaded (id
 * known), and again only if another listing is opened.
 */
export function useListingViewTracking(
  name: 'listing_view' | 'roommate_view',
  id: number | undefined,
): void {
  useEffect(() => {
    if (id === undefined) return
    track(name, name === 'listing_view' ? { property_id: id } : { roommate_listing_id: id })
  }, [name, id])
}
