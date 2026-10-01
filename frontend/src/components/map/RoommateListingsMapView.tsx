import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { formatMad } from '@/lib/formatPrice'
import type { RoommateListing } from '@/types/roommateListing'

// Same Marrakech default as LocationPicker/PropertiesMapView - shown only
// when NONE of the current results have coordinates (nothing to fit
// bounds to yet).
const DEFAULT_CENTER: [number, number] = [31.6295, -7.9811]
const DEFAULT_ZOOM = 12

interface GeolocatedListing {
  listing: RoommateListing
  latitude: number
  longitude: number
}

/**
 * Exact copy of PropertiesMapView's price-pill marker icon - see that
 * file for the full reasoning on the DivIcon/iconSize/translate setup.
 * Kept as its own function (not imported from there) on purpose: this
 * file is a standalone sibling of PropertiesMapView, not a shared
 * dependency between the two feature's maps, so a future change to one
 * marker's look never risks silently moving the other's.
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
 * changes (a new search, a new filter, switching the offer/request tab).
 * Same behavior as PropertiesMapView's FitToMarkers. */
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

interface RoommateListingsMapViewProps {
  listings: RoommateListing[]
}

/**
 * Map view for the /roommates search results — the roommate-listing
 * equivalent of PropertiesMapView, deliberately kept as its own
 * component rather than a shared/generic one: properties and roommate
 * posts are different models with different fields (price_per_person vs
 * primaryPrice()), and the two features should be free to diverge
 * (amenities, availability, whatever comes later) without one map
 * component having to branch on which kind of listing it's showing.
 *
 * In practice only "offer" posts carry a saved position — the form only
 * shows the map picker for that type (RoommateListingForm) — so this
 * will mostly show pins while the offer tab is active and an empty map
 * on the request tab. It doesn't hardcode that assumption though: it
 * just plots whatever listings have coordinates, same rule as
 * PropertiesMapView.
 */
export default function RoommateListingsMapView({ listings }: RoommateListingsMapViewProps) {
  const navigate = useNavigate()

  const geolocated: GeolocatedListing[] = listings.flatMap((listing) => {
    if (listing.latitude === null || listing.longitude === null) return []
    const latitude = Number(listing.latitude)
    const longitude = Number(listing.longitude)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return []
    return [{ listing, latitude, longitude }]
  })

  const points: [number, number][] = geolocated.map((item) => [item.latitude, item.longitude])

  return (
    <div className="isolate overflow-hidden rounded-xl border border-gray-200">
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '520px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers points={points} />
        {geolocated.map(({ listing, latitude, longitude }) => {
          const label = listing.price_per_person ? formatMad(listing.price_per_person) : listing.title
          return (
            <Marker
              key={listing.id}
              position={[latitude, longitude]}
              icon={priceIcon(label)}
              eventHandlers={{
                click: () => navigate(`/roommates/${listing.id}`),
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
