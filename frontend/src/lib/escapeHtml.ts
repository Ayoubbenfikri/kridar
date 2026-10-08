/**
 * Escapes text so it can be placed inside an HTML string safely.
 *
 * React escapes everything it renders by itself, so the app almost never
 * needs this. The exception is code that builds a RAW HTML STRING outside
 * React — today, Leaflet's L.divIcon({ html }) in the map views. Anything
 * typed by a user (a listing title, for instance) must go through this
 * before being put in such a string, otherwise a title like
 * `<img src=x onerror=...>` would run as code in every visitor's browser.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
