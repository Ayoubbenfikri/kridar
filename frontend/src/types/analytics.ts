/**
 * Mirrors GET /api/v1/admin/analytics (backend AnalyticsReportService,
 * Phase A2). Every "visitors" number is unique visitors PER DAY, added
 * up: the backend has no cookie, so the same person on two days counts
 * twice (see claude/kridar-analytics-plan.md).
 */
import type { AnalyticsEventName } from '@/lib/analytics'

export type AnalyticsRange = '7d' | '30d' | '90d'

export interface AnalyticsDay {
  /** YYYY-MM-DD */
  date: string
  visitors: number
  page_views: number
}

export interface AnalyticsTopListing {
  id: number
  /** Null when the listing was deleted since. */
  title: string | null
  views: number
  visitors: number
  contacts: number
}

export interface AnalyticsReport {
  range: AnalyticsRange
  from: string
  to: string
  totals: {
    visitors: number
    /** First page of a visit (landing pages). */
    visits: number
    page_views: number
    listing_views: number
    today_visitors: number
    today_page_views: number
  }
  conversion: {
    /** Percent of listing views followed by a contact. Null with no views. */
    contact_rate: number | null
    booking_rate: number | null
  }
  daily: AnalyticsDay[]
  top_pages: { path: string; views: number; visitors: number }[]
  top_properties: AnalyticsTopListing[]
  top_roommate_listings: AnalyticsTopListing[]
  /** "direct", a host such as "google.com", or an utm_source such as "facebook". */
  sources: { source: string; visits: number }[]
  devices: { value: 'mobile' | 'tablet' | 'desktop'; visitors: number }[]
  locales: { value: string; visitors: number }[]
  actions: { name: Exclude<AnalyticsEventName, 'page_view'>; total: number; visitors: number }[]
}
