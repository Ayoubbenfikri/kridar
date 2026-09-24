import i18n from '@/i18n'
import type { Property } from '@/types/property'

/**
 * Number and price formatting (Phase 27: made language-aware).
 *
 * These read i18n.language directly rather than taking it as an
 * argument. That keeps every call site unchanged — a price is formatted
 * in dozens of places — and it is the same approach axiosClient uses for
 * the Accept-Language header. The one thing to know is that a component
 * calling formatMad() will only re-render on a language change if it
 * also subscribes to it (useTranslation). Every page that shows a price
 * does, because it has other text to translate too.
 */

/**
 * Which locale to hand to toLocaleString.
 *
 * Darija maps to fr-FR ON PURPOSE. Morocco writes prices in Western
 * digits — 2 500, not ٢٥٠٠ — and an Arabic locale would switch the app
 * to Arabic-Indic numerals, which looks wrong on a price tag here and
 * makes the number harder to scan against the Latin "MAD" beside it.
 * fr-FR also gives the space thousands separator Moroccans expect.
 */
function numberLocale(): string {
  return i18n.language === 'en' ? 'en-US' : 'fr-FR'
}

/**
 * Which price to show depends on what the property actually offers.
 * "both" leads with the per-night price (matches how short-stay
 * platforms usually present things) — the details page also has
 * price_per_month available if a visitor wants the long-term rate.
 *
 * `unitKey` is a TRANSLATION KEY, not a word. It used to be the French
 * 'nuit' | 'mois', which meant this helper decided the language of four
 * different pages. Callers now do t(price.unitKey) and get the whole
 * phrase — including the separator, which is not a slash in Darija.
 *
 * `unit` is the OLD French word, kept deliberately and temporarily.
 * Three pages still read it — PropertyDetailsPage, OwnerPropertiesPage,
 * AdminPropertiesPage — and they are still hardcoded French anyway, so
 * feeding them French here is correct rather than sloppy. Dropping the
 * field now would have forced a full rewrite of three large files just
 * to change one word in each. DELETE IT in the phase that translates the
 * last of those three; tsc will point at every remaining reader.
 */
export function primaryPrice(
  property: Property,
): {
  amount: string
  unitKey: 'price.perNight' | 'price.perMonth'
  /** @deprecated Legacy French label — use t(unitKey). */
  unit: 'nuit' | 'mois'
} | null {
  if (property.rental_type === 'long_term') {
    return property.price_per_month
      ? { amount: property.price_per_month, unitKey: 'price.perMonth', unit: 'mois' }
      : null
  }
  return property.price_per_night
    ? { amount: property.price_per_night, unitKey: 'price.perNight', unit: 'nuit' }
    : null
}

/**
 * A price with its currency. "MAD" in French and English, "درهم" in
 * Darija — see common.currency.
 */
export function formatMad(amount: string | number): string {
  return `${formatNumber(amount)} ${i18n.t('common.currency')}`
}

/** The number alone, for the few places that add their own unit. */
export function formatNumber(amount: string | number): string {
  return Number(amount).toLocaleString(numberLocale())
}
