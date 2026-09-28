import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { DEFAULT_MARKER_ICON } from '@/components/map/leafletDefaultIcon'

const ZOOM = 15

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
  const position: [number, number] = [latitude, longitude]

  return (
    // isolate: Leaflet's own CSS gives its zoom controls/panes a z-index
    // up to 1000, which is higher than this app's sticky Navbar. Without
    // `isolate` (creates a new stacking context), those controls climb
    // above the navbar as soon as you scroll the map under it. `isolate`
    // traps every z-index Leaflet sets inside this wrapper, so nothing
    // from the map can ever render above page-level elements again.
    <div className="isolate overflow-hidden rounded-xl border border-gray-200">
      <MapContainer
        center={position}
        zoom={ZOOM}
        scrollWheelZoom={false}
        style={{ height: '280px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={DEFAULT_MARKER_ICON} />
      </MapContainer>
    </div>
  )
}
