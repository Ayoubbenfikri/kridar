export type MapStyle = 'street' | 'satellite'

export interface TileLayerConfig {
  url: string
  attribution: string
}

/**
 * The two tile providers behind the street/satellite toggle. Both are
 * free, keyless public tile servers — no Mapbox/Google API key to
 * provision or store, same as the OpenStreetMap tiles this app already
 * used with no token. Esri's World Imagery is the standard free
 * satellite layer used across Leaflet projects for exactly this reason.
 *
 * Shared here (not duplicated per map component) because it is pure
 * infrastructure with no listing-specific data — same reasoning as
 * leafletDefaultIcon.ts being the one shared file among these otherwise
 * deliberately-duplicated map components (see PropertiesMapView's
 * priceIcon() comment for why the rest stay separate).
 */
export const TILE_LAYERS: Record<MapStyle, TileLayerConfig> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
}
