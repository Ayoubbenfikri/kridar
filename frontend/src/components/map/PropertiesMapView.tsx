import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { formatMad, primaryPrice } from '@/lib/formatPrice'
import MapOverlayControls from '@/components/map/MapOverlayControls'
import { TILE_LAYERS } from '@/components/map/mapTileStyles'
import type { MapStyle } from '@/components/map/mapTileStyles'
import type { Property } from '@/types/property'

// Same Marrakech default as LocationPicker - shown only when NONE of the
// current results have coordinates (nothing to fit bounds to yet).
const DEFAULT_CENTER: [number, number] = [31.6295, -7.9811]
const DEFAULT_ZOOM = 12

interface GeolocatedProperty {
  property: Property
  latitude: number
  longitude: number
}

/**
 * One price "balloon" marker per property, built as a Leaflet DivIcon (not
 * a React <Marker icon> component - Leaflet renders icons as plain HTML
 * outside React). `className: ''` replaces Leaflet's default
 * `.leaflet-div-icon` class entirely, which is what stops Leaflet's own
 * white-box-with-border style from showing through underneath ours.
 *
 * Shape: a rounded price pill in the brand teal, sitting on top of a small
 * downward-pointing triangle ("tail") - the classic map-pin silhouette
 * (Booking.com style), so the marker visibly points at its exact
 * coordinate instead of just floating near it.
 *
 * iconSize [0, 0] + `-translate-x-1/2 -translate-y-full` is what keeps the
 * TAIL's tip anchored exactly on the coordinate regardless of the price
 * text's width - sizing the icon box to the text itself (as Leaflet
 * expects by default) would mean measuring text width by hand for every
 * possible price. The translate moves the whole stack (pill + tail) up
 * and left so the tail's point, not the pill's corner, lands on the pin.
 *
 * The two pieces are stacked with `inline-flex flex-col items-center`
 * rather than a plain block `<div>`: Leaflet wraps this html in a
 * container it sizes to iconSize, i.e. 0x0, and a block box with no
 * explicit width shrinks to fit that zero-width parent. inline-flex sizes
 * the wrapper to its own content (the pill + tail) instead, ignoring the
 * parent's width entirely - same fix as the earlier inline-block one, just
 * flex because there are now two stacked pieces instead of one.
 *
 * The tail itself is a CSS border-triangle: zero width/height with
 * transparent left/right borders and a solid top border, all done with
 * Tailwind's border-color/width utilities (border-t-brand-600 etc.) so it
 * stays in sync with the brand color instead of a hardcoded hex.
 */
function priceIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div class="inline-flex -translate-x-1/2 -translate-y-full cursor-pointer flex-col items-center transition hover:scale-105">
        <div class="whitespace-nowrap rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">${label}</div>
        <div class="h-0 w-0 border-x-[6px] border-x-transparent border-t-[7px] border-t-brand-600"></div>
      </div>
    `,
    iconSize: [0, 0],
  })
}

/** Zooms/pans the map to fit every marker as soon as the result set
 * changes (a new search, a new filter). Re-fitting on every change - not
 * just once on mount - is what makes switching filters while already in
 * map view actually move the map instead of leaving it on the old
 * search's area. */
function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
  }, [points, map])

  return null
}

interface PropertiesMapViewProps {
  properties: Property[]
}

/**
 * Map view for the /properties search results: one price-pill marker
 * per property that has a saved location, auto-fitted to show all of
 * them, click-to-open like a card. Properties with no coordinates are
 * silently skipped - they still show up in the grid view, just not
 * here, same rule as the details-page map (sub-phase #2).
 */
export default function PropertiesMapView({ properties }: PropertiesMapViewProps) {
  const navigate = useNavigate()
  const [mapStyle, setMapStyle] = useState<MapStyle>('street')

  const geolocated: GeolocatedProperty[] = properties.flatMap((property) => {
    if (property.latitude === null || property.longitude === null) return []
    const latitude = Number(property.latitude)
    const longitude = Number(property.longitude)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return []
    return [{ property, latitude, longitude }]
  })

  const points: [number, number][] = geolocated.map((item) => [item.latitude, item.longitude])

  return (
    <div className="isolate overflow-hidden rounded-xl border border-gray-200">
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '520px', width: '100%' }}>
        {/* key forces a clean remount when the provider changes, rather
            than relying on react-leaflet's own url-prop diffing. */}
        <TileLayer key={mapStyle} {...TILE_LAYERS[mapStyle]} />
        <MapOverlayControls mapStyle={mapStyle} onToggleStyle={setMapStyle} showLocate />
        <FitToMarkers points={points} />
        {geolocated.map(({ property, latitude, longitude }) => {
          const price = primaryPrice(property)
          const label = price ? formatMad(price.amount) : property.title
          return (
            <Marker
              key={property.id}
              position={[latitude, longitude]}
              icon={priceIcon(label)}
              eventHandlers={{
                click: () => navigate(`/properties/${property.id}`),
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
