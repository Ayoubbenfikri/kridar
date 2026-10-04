/**
 * Shared by the home page's search bar, its city chips and its
 * "browse by type" tiles, so all three build the exact same URLs.
 *
 * The home search has three intents, not two, because "short stay" and
 * "monthly rental" are really different searches (different price column,
 * different fields):
 *   short -> /properties?rental_type=short_term
 *   long  -> /properties?rental_type=long_term
 *   buy   -> /buy
 * Every parameter used here is one /properties and /buy already read
 * back from the URL (see PropertiesPage), so nothing new on the backend.
 */
export type SearchMode = 'short' | 'long' | 'buy'

export interface BudgetPreset {
  /** Stable id used as the <option> value. */
  id: string
  min?: number
  max?: number
}

// Same ranges as the old quick chips: monthly rent and sale price, in MAD.
export const LONG_BUDGETS: BudgetPreset[] = [
  { id: 'l1', max: 3_000 },
  { id: 'l2', min: 3_000, max: 6_000 },
  { id: 'l3', min: 6_000 },
]

export const BUY_BUDGETS: BudgetPreset[] = [
  { id: 'b1', max: 500_000 },
  { id: 'b2', min: 500_000, max: 1_000_000 },
  { id: 'b3', min: 1_000_000, max: 2_000_000 },
  { id: 'b4', min: 2_000_000 },
]

/** 500000 -> "500 K", 2000000 -> "2 M", 3000 -> "3 K". */
function compact(amount: number): string {
  if (amount >= 1_000_000) return `${amount / 1_000_000} M`
  if (amount >= 1_000) return `${amount / 1_000} K`
  return String(amount)
}

export function budgetLabel(preset: BudgetPreset, currency: string): string {
  if (preset.min === undefined && preset.max !== undefined)
    return `< ${compact(preset.max)} ${currency}`
  if (preset.max === undefined && preset.min !== undefined)
    return `> ${compact(preset.min)} ${currency}`
  return `${compact(preset.min ?? 0)} – ${compact(preset.max ?? 0)} ${currency}`
}

/**
 * Builds the listing URL for a mode. Empty values are left out - an empty
 * `q=` would be sent to the API as a real filter.
 */
export function searchUrl(mode: SearchMode, params: Record<string, string | undefined> = {}): string {
  const search = new URLSearchParams()
  if (mode === 'short') search.set('rental_type', 'short_term')
  if (mode === 'long') search.set('rental_type', 'long_term')
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const path = mode === 'buy' ? '/buy' : '/properties'
  const query = search.toString()
  return query ? `${path}?${query}` : path
}
