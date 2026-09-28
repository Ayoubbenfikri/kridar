import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

/**
 * Leaflet's default marker icon points at image paths that don't survive
 * Vite's bundling (they resolve relative to the leaflet package, not the
 * built app) - without this fix the marker renders as a broken/empty
 * image. Building one explicit L.icon(...) - with every size/anchor
 * Leaflet's own default normally provides - and assigning it directly to
 * L.Marker.prototype.options.icon is what actually holds across Vite
 * dev/build: every <Marker> that doesn't get its own `icon` prop uses
 * this exact object, not a path Leaflet has to re-resolve itself.
 *
 * Shared in its own module (not repeated inside LocationPicker and
 * PropertyLocationMap) so the fix runs exactly once regardless of which
 * map component a page happens to load first.
 */
export const DEFAULT_MARKER_ICON = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DEFAULT_MARKER_ICON
