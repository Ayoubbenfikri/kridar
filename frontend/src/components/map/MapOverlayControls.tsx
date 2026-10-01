import { useState } from 'react'
import { useMap } from 'react-leaflet'
import { Locate, LocateFixed, Map as MapIcon, Satellite } from 'lucide-react'
import type { MapStyle } from './mapTileStyles'

const LOCATE_ZOOM = 15

/**
 * The two buttons a map can show, bundled as ONE control so they stack
 * predictably in the same corner instead of relying on Leaflet's own
 * multi-control stacking rules:
 *
 *  - Style toggle (street / satellite) — always shown.
 *  - "Me localiser" (geolocation) — only when `showLocate` is set, i.e.
 *    only on the maps that asked for it (the search-results maps,
 *    LocationPicker). PropertyLocationMap (read-only details page) gets
 *    the style toggle alone.
 *
 * Must be rendered as a CHILD of <MapContainer> — it needs Leaflet's own
 * `map` instance via useMap() to recenter, which only exists inside the
 * MapContainer tree. Positioned with Leaflet's own `.leaflet-top`/
 * `.leaflet-right` classes — react-leaflet's documented way to place a
 * custom control without writing a raw Leaflet Control subclass — so it
 * sits in the map's top-right corner with the same z-index handling as
 * the built-in zoom buttons, no bespoke positioning CSS needed. The two
 * buttons are grouped in one rounded box with our own flex-col instead
 * of two separate Leaflet controls, so they always stack the same way
 * regardless of Leaflet version quirks.
 */
export default function MapOverlayControls({
  mapStyle,
  onToggleStyle,
  showLocate = false,
  onLocate,
}: {
  mapStyle: MapStyle
  onToggleStyle: (style: MapStyle) => void
  showLocate?: boolean
  /**
   * LocationPicker-only: also reports the detected coordinates up, so
   * locating doubles as "use my position" and fills in the form. The
   * search maps leave this out — there's nothing to "pick" there,
   * locating just recenters the map.
   */
  onLocate?: (lat: number, lng: number) => void
}) {
  const map = useMap()
  const [locating, setLocating] = useState(false)
  const [denied, setDenied] = useState(false)

  function locate() {
    if (!navigator.geolocation) return

    setLocating(true)
    setDenied(false)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.setView([latitude, longitude], LOCATE_ZOOM)
        onLocate?.(latitude, longitude)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setDenied(true)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control flex flex-col overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
        <button
          type="button"
          title={mapStyle === 'street' ? 'Vue satellite' : 'Vue carte'}
          onClick={() => onToggleStyle(mapStyle === 'street' ? 'satellite' : 'street')}
          className={`flex size-[30px] items-center justify-center bg-white text-gray-700 transition hover:bg-gray-50 ${
            showLocate ? 'border-b border-gray-200' : ''
          }`}
        >
          {mapStyle === 'street' ? (
            <Satellite className="size-4" aria-hidden />
          ) : (
            <MapIcon className="size-4" aria-hidden />
          )}
        </button>

        {showLocate && (
          <button
            type="button"
            title={denied ? 'Localisation refusée' : 'Me localiser'}
            onClick={locate}
            disabled={locating}
            className="flex size-[30px] items-center justify-center bg-white text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {locating ? (
              <Locate className="size-4 animate-pulse" aria-hidden />
            ) : (
              <LocateFixed className={denied ? 'size-4 text-red-500' : 'size-4'} aria-hidden />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
