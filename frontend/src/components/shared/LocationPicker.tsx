/**
 * LocationPicker — fully free, no-API-key map using react-leaflet + OpenStreetMap
 *
 * Features:
 *  • OpenStreetMap tile layer (no API key needed)
 *  • Nominatim search (forward geocode — India-restricted)
 *  • Nominatim reverse geocode on click / drag / locate
 *  • Draggable marker
 *  • "Use my location" geolocation button
 *  • Skeleton loading state
 *  • Graceful error handling
 */
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react'

// ─── Fix Leaflet's default marker icons (Vite asset pipeline) ─────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// ─── Custom green marker ──────────────────────────────────────────────────────
const GREEN_ICON = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.268 21.732 0 14 0z"
            fill="#2E7D32" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>`),
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationPickerData {
  lat: number
  lng: number
  placeName: string
}

export interface LocationPickerProps {
  onLocationChange: (data: LocationPickerData) => void
  defaultCenter?: { lat: number; lng: number }
  height?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KERALA_CENTER: [number, number] = [10.8505, 76.2711]
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'
const NOMINATIM_SEARCH  = 'https://nominatim.openstreetmap.org/search'

// Nominatim requires a descriptive User-Agent to avoid being blocked
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'AgriAssistKerala/1.0 (farming assistant; educational use)',
}

// ─── Nominatim helpers ────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: {
    village?: string
    town?: string
    city?: string
    county?: string
    state?: string
  }
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const url = `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, { headers: NOMINATIM_HEADERS })
    if (!res.ok) throw new Error('Nominatim error')
    const data: NominatimResult = await res.json()
    const a = data.address ?? {}
    const locality = a.village ?? a.town ?? a.city ?? a.county
    const state = a.state
    if (locality && state) return `${locality}, ${state}`
    if (locality) return locality
    if (data.display_name) {
      // Return first two comma-separated parts for brevity
      return data.display_name.split(',').slice(0, 2).join(',').trim()
    }
  } catch { /* fall through */ }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

const forwardGeocode = async (query: string): Promise<NominatimResult[]> => {
  const url =
    `${NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=json` +
    `&countrycodes=in&addressdetails=1&limit=5`
  const res = await fetch(url, { headers: NOMINATIM_HEADERS })
  if (!res.ok) return []
  return res.json()
}

// ─── Map sub-components ───────────────────────────────────────────────────────

/** Fires a callback whenever the user clicks the map */
const ClickHandler = ({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void
}) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Imperatively re-centers the map when `center` prop changes */
const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, Math.max(map.getZoom(), 12))
    }
  }, [center, map])
  return null
}

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast = ({ msg, onClose }: { msg: string; onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#323232',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 8,
        fontSize: '0.875rem',
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      {msg}
    </div>
  )
}

// ─── Search box ───────────────────────────────────────────────────────────────

interface SearchBoxProps {
  onSelect: (lat: number, lng: number, name: string) => void
}

const SearchBox = ({ onSelect }: SearchBoxProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const data = await forwardGeocode(q)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 500)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      search(query)
    }
    if (e.key === 'Escape') { setResults([]); setQuery('') }
  }

  const handleSelect = (r: NominatimResult) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const a = r.address ?? {}
    const name =
      a.village ?? a.town ?? a.city ??
      r.display_name.split(',').slice(0, 2).join(',').trim()
    setQuery(name)
    setResults([])
    onSelect(lat, lng, name)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
            color: 'var(--color-text-secondary)',
            pointerEvents: 'none',
          }}
        />
        <input
          id="location-search-input"
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search your village / town…"
          autoComplete="off"
          className="form-input"
          style={{ paddingLeft: 36, paddingRight: 36, width: '100%', boxSizing: 'border-box', borderRadius: 10 }}
        />
        {loading && (
          <Loader2
            size={16}
            style={{
              position: 'absolute',
              right: 12,
              color: 'var(--color-text-secondary)',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
      </div>

      {results.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#fff',
            border: '1.5px solid var(--color-border)',
            borderRadius: 10,
            marginTop: 4,
            padding: 0,
            listStyle: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                borderBottom: i < results.length - 1 ? '1px solid #f0ebe0' : 'none',
                transition: 'background 0.15s',
                lineHeight: 1.4,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = '#F5F0E8')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLLIElement).style.background = '#fff')}
            >
              <MapPin size={12} style={{ marginRight: 6, color: 'var(--color-primary)', verticalAlign: 'middle' }} />
              {r.display_name.split(',').slice(0, 3).join(',')}
            </li>
          ))}
        </ul>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Main LocationPicker ──────────────────────────────────────────────────────

export const LocationPicker = ({
  onLocationChange,
  defaultCenter,
  height = '300px',
}: LocationPickerProps) => {
  const initCenter: [number, number] = defaultCenter
    ? [defaultCenter.lat, defaultCenter.lng]
    : KERALA_CENTER

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // ── Internal update helper ──────────────────────────────────────────────────
  const applyLocation = useCallback(
    (lat: number, lng: number, name: string) => {
      setMarkerPos([lat, lng])
      setPlaceName(name)
      onLocationChange({ lat, lng, placeName: name })
    },
    [onLocationChange]
  )

  // ── Map click ───────────────────────────────────────────────────────────────
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      const name = await reverseGeocode(lat, lng)
      applyLocation(lat, lng, name)
    },
    [applyLocation]
  )

  // ── Drag end ────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (e: L.DragEndEvent) => {
      const pos = (e.target as L.Marker).getLatLng()
      const name = await reverseGeocode(pos.lat, pos.lng)
      applyLocation(pos.lat, pos.lng, name)
    },
    [applyLocation]
  )

  // ── Search select ───────────────────────────────────────────────────────────
  const handleSearchSelect = useCallback(
    (lat: number, lng: number, name: string) => {
      setFlyTo([lat, lng])
      applyLocation(lat, lng, name)
    },
    [applyLocation]
  )

  // ── Geolocation ─────────────────────────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setToast('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const name = await reverseGeocode(lat, lng)
        setFlyTo([lat, lng])
        applyLocation(lat, lng, name)
      },
      () => {
        setToast('Location permission denied — search or tap the map to pick your location.')
      }
    )
  }, [applyLocation])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search */}
      <SearchBox onSelect={handleSearchSelect} />

      {/* Map */}
      <div
        id="leaflet-map-container"
        style={{
          height,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1.5px solid var(--color-border)',
          position: 'relative',
        }}
      >
        <MapContainer
          center={initCenter}
          zoom={8}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler onClick={handleMapClick} />
          <MapController center={flyTo} />

          {markerPos && (
            <Marker
              position={markerPos}
              icon={GREEN_ICON}
              draggable={true}
              eventHandlers={{ dragend: handleDragEnd }}
            />
          )}
        </MapContainer>

        {/* Geolocation button — overlaid on map */}
        <button
          id="geolocate-btn"
          onClick={handleGeolocate}
          title="Use my current location"
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            zIndex: 1000,
            width: 40,
            height: 40,
            borderRadius: 10,
            border: 'none',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-primary)',
          }}
        >
          <Navigation size={18} />
        </button>
      </div>

      {/* Selected place label */}
      {placeName && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.875rem',
            color: 'var(--color-primary)',
            fontWeight: 600,
            padding: '6px 10px',
            background: 'rgba(46, 125, 50, 0.08)',
            borderRadius: 8,
            border: '1px solid rgba(46, 125, 50, 0.15)',
          }}
        >
          <MapPin size={14} />
          <span>📍 {placeName}</span>
        </div>
      )}

      {/* Hint */}
      {!markerPos && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
          Search above, tap the map, or use the 📍 button to pick your field location.
        </p>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Mobile height override */}
      <style>{`
        @media (max-width: 600px) {
          #leaflet-map-container { height: 220px !important; }
        }
      `}</style>
    </div>
  )
}
