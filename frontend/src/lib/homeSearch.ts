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
