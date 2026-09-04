import type { Property } from '@/types/property'

/**
 * Which price to show depends on what the property actually offers.
 * "both" leads with the per-night price (matches how short-stay
 * platforms usually present things) — the details page also has
 * price_per_month available if a visitor wants the long-term rate.
 */
export function primaryPrice(property: Property): { amount: string; unit: 'nuit' | 'mois' } | null {
  if (property.rental_type === 'long_term') {
    return property.price_per_month ? { amount: property.price_per_month, unit: 'mois' } : null
  }
  return property.price_per_night ? { amount: property.price_per_night, unit: 'nuit' } : null
}

export function formatMad(amount: string | number): string {
  return `${Number(amount).toLocaleString('fr-FR')} MAD`
}
