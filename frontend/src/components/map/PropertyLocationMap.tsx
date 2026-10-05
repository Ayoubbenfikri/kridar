import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import type L from 'leaflet'
import { AlertCircle, Navigation, Route } from 'lucide-react'
import { DEFAULT_MARKER_ICON } from '@/components/map/leafletDefaultIcon'
import MapOverlayControls from '@/components/map/MapOverlayControls'
import { TILE_LAYERS } from '@/components/map/mapTileStyles'
import type { MapStyle } from '@/components/map/mapTileStyles'
import { buttonClasses } from '@/components/ui'

const ZOOM = 15
const ROUTE_COLOR = '#0f766e' // brand-600 — see index.css
const YOU_COLOR = '#2563eb' // a distinct blue so "you" never reads as the listing's own marker

/**
 * OSRM's shape for GET /route/v1/{profile}/{coords}?geometries=geojson.
 * Only the fields this component actually reads.
 */
interface OsrmRouteResponse {
  routes?: {
    distance: number // meters
    duration: number // seconds
    geometry: { coordinates: [number, number][] } // [lng, lat] pairs, GeoJSON order
  }[]
}

type RouteStatus = 'idle' | 'locating' | 'routing' | 'denied' | 'error'

interface PropertyLocationMapProps {
  latitude: number
  longitude: number
}

/**
 * Read-only OpenStreetMap view for the property details page: one fixed
 * marker, no click-to-move, no drag - unlike LocationPicker (the owner's
 * form control), a guest browsing a listing should never be able to
 * accidentally change anything here.
 *
 * scrollWheelZoom is off on purpose: this map sits inside a long,
 * scrollable page, and a guest scrolling past it with their mouse over
 * the map would otherwise have the page scroll hijacked into a map zoom.
 * Dragging to pan and the +/- zoom buttons still work.
 */
export default function PropertyLocationMap({ latitude, longitude }: PropertyLocationMapProps) {
  const { t } = useTranslation()
  const [mapStyle, setMapStyle] = useState<MapStyle>('street')
  const position: [number, number] = [latitude, longitude]

  // MapContainer forwards its ref to the underlying Leaflet map instance.
  // Held here (outside the MapContainer tree) so the "Itinéraire" button
  // below the map — a plain page button, not a Leaflet control — can
  // still call fitBounds() once a route comes back, without needing
  // useMap() (which only works INSIDE <MapContainer>).
  const mapRef = useRef<L.Map>(null)

  const [status, setStatus] = useState<RouteStatus>('idle')
  const [youPosition, setYouPosition] = useState<[number, number] | null>(null)
  const [routeLine, setRouteLine] = useState<[number, number][] | null>(null)
  const [routeSummary, setRouteSummary] = useState<{ km: string; minutes: number } | null>(null)

  /**
   * "Itinéraire" — locates the visitor, asks OSRM's public routing
   * server for a driving route to this listing, and draws it on the
   * embedded map. OSRM's demo server (router.project-osrm.org) is the
   * standard free, keyless routing API used across Leaflet projects for
   * exactly this — same "no token to provision" reasoning as the
   * satellite tiles (see mapTileStyles.ts). It's a public demo instance
   * with no uptime guarantee, so a failed request falls back to a
   * straight line between the two points rather than showing nothing.
   */
  async function showRoute() {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }

    setStatus('locating')

    navigator.geolocation.getCurrentPosition(
      async (geo) => {
        const you: [number, number] = [geo.coords.latitude, geo.coords.longitude]
        setYouPosition(you)
        setStatus('routing')

        try {
          const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${geo.coords.longitude},${geo.coords.latitude};${longitude},${latitude}` +
            `?overview=full&geometries=geojson`

          const response = await fetch(url)
          if (!response.ok) throw new Error('OSRM request failed')

          const data = (await response.json()) as OsrmRouteResponse
          const route = data.routes?.[0]
          if (!route) throw new Error('No route in OSRM response')

          const line: [number, number][] = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          setRouteLine(line)
          setRouteSummary({
            km: (route.distance / 1000).toFixed(1),
            minutes: Math.round(route.duration / 60),
          })
          setStatus('idle')
          mapRef.current?.fitBounds([you, position, ...line] as [number, number][], { padding: [40, 40] })
        } catch {
          // OSRM unreachable/rate-limited — a straight line is still more
          // useful than nothing, it just isn't an actual driving route.
          setRouteLine([you, position])
          setRouteSummary(null)
          setStatus('idle')
          mapRef.current?.fitBounds([you, position], { padding: [40, 40] })
        }
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  // Opens Google Maps' own directions screen as a secondary option —
  // real turn-by-turn navigation on the visitor's phone, which this
  // embedded preview deliberately doesn't try to replicate.
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`

  return (
    <div>
      {/* isolate: Leaflet's own CSS gives its zoom controls/panes a
          z-index up to 1000, which is higher than this app's sticky
          Navbar. Without `isolate` (creates a new stacking context),
          those controls climb above the navbar as soon as you scroll the
          map under it. `isolate` traps every z-index Leaflet sets inside
          this wrapper, so nothing from the map can ever render above
          page-level elements again. */}
      <div className="isolate overflow-hidden rounded-xl border border-gray-200">
        <MapContainer
          ref={mapRef}
          center={position}
          zoom={ZOOM}
          scrollWheelZoom={false}
          style={{ height: '280px', width: '100%' }}
        >
          {/* key forces a clean remount when the provider changes, rather
              than relying on react-leaflet's own url-prop diffing. */}
          <TileLayer key={mapStyle} {...TILE_LAYERS[mapStyle]} />
          {/* Read-only page — style toggle only, no "me localiser" button
              in the corner control: locating here is tied to the
              "Itinéraire" action below, not a generic recenter. */}
          <MapOverlayControls mapStyle={mapStyle} onToggleStyle={setMapStyle} />
          <Marker position={position} icon={DEFAULT_MARKER_ICON} />

          {youPosition && (
            <CircleMarker
              center={youPosition}
              radius={7}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: YOU_COLOR, fillOpacity: 1 }}
            />
          )}

          {routeLine && <Polyline positions={routeLine} pathOptions={{ color: ROUTE_COLOR, weight: 4, opacity: 0.85 }} />}
        </MapContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={showRoute}
          disabled={status === 'locating' || status === 'routing'}
          className={buttonClasses({ variant: 'secondary', size: 'sm' })}
        >
          <Route className="size-4" aria-hidden />
          {status === 'locating'
            ? t('map.locating')
            : status === 'routing'
              ? t('map.routing')
              : t('map.route')}
        </button>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: 'ghost', size: 'sm' })}
        >
          <Navigation className="size-4" aria-hidden />
          {t('map.openGoogleMaps')}
        </a>
      </div>

      {routeSummary && (
        <p className="mt-2 text-sm text-gray-600">
          {t('map.routeSummary', { km: routeSummary.km, minutes: routeSummary.minutes })}
        </p>
      )}

      {status === 'denied' && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('map.deniedHelp')}
        </p>
      )}

      {status === 'error' && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('map.unavailable')}
        </p>
      )}
    </div>
  )
}
