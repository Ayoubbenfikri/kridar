import { useEffect, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type L from 'leaflet'
import { DEFAULT_MARKER_ICON } from '@/components/map/leafletDefaultIcon'

// Marrakech - Kridar's main market in the current demo data - a sensible
// default center when a property has no location set yet.
const DEFAULT_CENTER: [number, number] = [31.6295, -7.9811]
const DEFAULT_ZOOM = 12
const PICKED_ZOOM = 15

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
  /** Called with the new coordinates whenever the owner clicks the map
   * or drags the marker. The parent form owns the actual state - this
   * component never stores the position itself. */
  onChange: (lat: number, lng: number) => void
}

/**
 * Recenters the map when the picked position changes from OUTSIDE the
 * map itself - e.g. the owner switches from creating one property to
 * editing another that already has coordinates. A plain
 * `<MapContainer center=...>` only applies once, on first mount, so
 * without this the map would keep showing the previous property's view.
 * It deliberately only recenters once per mount (via the ref) - after
 * that, clicks/drags move the marker without fighting the user by
 * re-centering under their cursor.
 */
function RecenterOnce({ position }: { position: [number, number] | null }) {
  const map = useMap()
  const hasCentered = useRef(false)

  useEffect(() => {
    if (position && !hasCentered.current) {
      map.setView(position, PICKED_ZOOM)
      hasCentered.current = true
    }
  }, [position, map])

  return null
}

/** Invisible helper: listens for clicks on the map and reports the
 * coordinates up, instead of rendering anything itself. This is the
 * react-leaflet pattern for map events - there is no `onClick` prop on
 * <MapContainer>. */
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

/**
 * Interactive OpenStreetMap picker for a property's location. Click
 * anywhere on the map, or drag the marker once it exists, to set the
 * coordinates - the parent form (PropertyForm) is the source of truth
 * for latitude/longitude, this component only ever reports changes via
 * onChange.
 *
 * IMPORTANT for callers: pass a stable `key` prop (e.g. the property id,
 * or "new" when creating) on this component from the parent whenever it
 * might render for a DIFFERENT property without a full page reload -
 * for example PropertyCreatePage redirecting straight to
 * PropertyEditPage after a successful create. Leaflet manages its map
 * instance outside of React, and reusing the same LocationPicker
 * instance across two different properties can leave the map stuck
 * uninitialised. A changed `key` forces React to unmount the old map
 * and mount a genuinely fresh one instead of trying to update it in
 * place. See PropertyForm.tsx for where this is applied.
 */
export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const position: [number, number] | null =
    latitude !== null && longitude !== null && !Number.isNaN(latitude) && !Number.isNaN(longitude)
      ? [latitude, longitude]
      : null

  return (
    // isolate: same fix as PropertyLocationMap - contains Leaflet's own
    // high z-index (up to 1000 on its zoom controls) inside this wrapper
    // so it can never render above the app's sticky Navbar while scrolling.
    <div className="isolate overflow-hidden rounded-lg border border-gray-200">
      <MapContainer
        center={position ?? DEFAULT_CENTER}
        zoom={position ? PICKED_ZOOM : DEFAULT_ZOOM}
        style={{ height: '320px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <RecenterOnce position={position} />
        {position && (
          <Marker
            position={position}
            draggable
            icon={DEFAULT_MARKER_ICON}
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker
                const { lat, lng } = marker.getLatLng()
                onChange(lat, lng)
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
