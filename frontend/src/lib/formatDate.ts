import i18n from '@/i18n'

/**
 * Date formatting that follows the interface language.
 *
 * Same idea as formatPrice.ts: read i18n.language directly, so call sites
 * stay one line. A component only re-renders on a language change if it
 * also uses useTranslation(), which every page that shows a date does.
 *
 *  - fr  -> fr-FR  ("4 oct. 2026")
 *  - en  -> en-GB  ("4 Oct 2026": day first, like French, not "Oct 4")
 *  - ary -> ar-MA with Latin digits (-u-nu-latn): Arabic month and day
 *           names, but 2026 and not ٢٠٢٦, same reason as the prices (see
 *           numberLocale() in formatPrice.ts).
 */
export function dateLocale(): string {
  switch (i18n.language) {
    case 'en':
      return 'en-GB'
    case 'ary':
      return 'ar-MA-u-nu-latn'
    default:
      return 'fr-FR'
  }
}

/**
 * The API sends plain dates as "2026-10-04". `new Date('2026-10-04')` reads
 * that as midnight UTC, which a browser west of Greenwich would then show
 * as the 3rd. Reading it as LOCAL midnight keeps the day the owner chose.
 */
function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
}

const DEFAULT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = DEFAULT_DATE): string {
  return toDate(value).toLocaleDateString(dateLocale(), options)
}

export function formatDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { ...DEFAULT_DATE, hour: '2-digit', minute: '2-digit' },
): string {
  return toDate(value).toLocaleString(dateLocale(), options)
}
