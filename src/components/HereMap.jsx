import { useEffect, useRef } from 'react'

const API_KEY = import.meta.env.VITE_HERE_API_KEY

/**
 * HERE Maps component.
 *
 * Props:
 *   markers  — [{ lat, lng, label, color }]
 *   route    — { pickup: {lat,lng}, dropoff: {lat,lng} }
 *   center   — { lat, lng }
 *   zoom     — number (default 13)
 *   height   — CSS string (default '420px')
 *   onMapClick — (lat, lng) => void
 */
export default function HereMap({ markers = [], route, center, zoom = 13, height = '420px', onMapClick }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const platformRef  = useRef(null)
  const objectsRef   = useRef([])
  const rafRef       = useRef(null)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return
    if (!API_KEY || API_KEY === 'your_here_api_key_here') return

    // Defer until the container is painted and has real dimensions
    rafRef.current = requestAnimationFrame(() => {
      const el = containerRef.current
      if (!el || !window.H) return

      // Container might still be zero-sized on first paint — wait one more frame
      if (el.offsetWidth === 0 || el.offsetHeight === 0) {
        rafRef.current = requestAnimationFrame(() => initMap(el))
      } else {
        initMap(el)
      }
    })

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (mapRef.current) {
        try { mapRef.current.dispose() } catch {}
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function initMap(el) {
    try {
      const platform = new window.H.service.Platform({ apikey: API_KEY })
      platformRef.current = platform

      const layers  = platform.createDefaultLayers()
      const initial = center ?? (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: -1.2921, lng: 36.8219 })

      // Use HARP (WebGL2) engine; gracefully falls back inside HERE SDK
      const map = new window.H.Map(el, layers.vector.normal.map, {
        center: initial,
        zoom,
        pixelRatio: window.devicePixelRatio || 1,
      })
      mapRef.current = map

      new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map))
      window.H.ui.UI.createDefault(map, layers)

      const ro = new ResizeObserver(() => {
        try { map.getViewPort().resize() } catch {}
      })
      ro.observe(el)
      map._ro = ro   // stash for cleanup

      if (onMapClick) {
        map.addEventListener('tap', (evt) => {
          try {
            const coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY)
            onMapClick(coord.lat, coord.lng)
          } catch {}
        })
      }

      // Draw initial markers / route after map is ready
      syncMarkers(map)
      if (route?.pickup?.lat && route?.dropoff?.lat) drawRoute(map, platform)
    } catch (err) {
      console.warn('HereMap init failed:', err)
    }
  }

  // ── Markers ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.H) return
    syncMarkers(map)
  }, [markers]) // eslint-disable-line react-hooks/exhaustive-deps

  function syncMarkers(map) {
    // Remove old
    objectsRef.current.forEach(obj => {
      try { map.removeObject(obj) } catch {}
    })
    objectsRef.current = []

    if (!markers.length) return

    markers.forEach(m => {
      if (m.lat == null || m.lng == null) return
      try {
        const marker = buildMarker(m)
        map.addObject(marker)
        objectsRef.current.push(marker)
      } catch {}
    })

    // Fit viewport
    try {
      if (markers.length === 1) {
        map.setCenter({ lat: markers[0].lat, lng: markers[0].lng }, true)
      } else {
        // Build bounding box from coordinates manually — avoids the group clone crash
        const lats = markers.map(m => m.lat)
        const lngs = markers.map(m => m.lng)
        const bbox = new window.H.geo.Rect(
          Math.max(...lats), Math.min(...lngs),
          Math.min(...lats), Math.max(...lngs)
        )
        map.getViewModel().setLookAtData({ bounds: bbox, padding: { top: 60, bottom: 60, left: 60, right: 60 } }, true)
      }
    } catch {}
  }

  // ── Route ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    const platform = platformRef.current
    if (!map || !platform || !window.H) return
    if (!route?.pickup?.lat || !route?.dropoff?.lat) return
    drawRoute(map, platform)
  }, [route?.pickup?.lat, route?.pickup?.lng, route?.dropoff?.lat, route?.dropoff?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  function drawRoute(map, platform) {
    const router = platform.getRoutingService(null, 8)
    router.calculateRoute(
      {
        routingMode:   'fast',
        transportMode: 'car',
        origin:      `${route.pickup.lat},${route.pickup.lng}`,
        destination: `${route.dropoff.lat},${route.dropoff.lng}`,
        return:      'polyline',
      },
      (result) => {
        const polylineStr = result.routes?.[0]?.sections?.[0]?.polyline
        if (!polylineStr) return
        try {
          const linestring = window.H.geo.LineString.fromFlexiblePolyline(polylineStr)
          const routeLine  = new window.H.map.Polyline(linestring, {
            style: { strokeColor: '#FF5E14', lineWidth: 5 },
          })
          map.addObject(routeLine)
          objectsRef.current.push(routeLine)
          map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox(), padding: { top: 60, bottom: 60, left: 60, right: 60 } }, true)
        } catch (e) {
          console.warn('Route render error:', e)
        }
      },
      (err) => console.warn('Routing error:', err)
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!API_KEY || API_KEY === 'your_here_api_key_here') {
    return (
      <div style={{ height, background: '#f0f0f0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, border: '2px dashed var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Map unavailable — set VITE_HERE_API_KEY</span>
      </div>
    )
  }

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }} />
}

function buildMarker({ lat, lng, color = '#FF5E14', label = '', type = 'circle' }) {
  let svg
  if (type === 'bike') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="${color}" stroke="#fff" stroke-width="3"/>
      <g transform="translate(8,10)" fill="#fff">
        <circle cx="5" cy="16" r="4" fill="none" stroke="#fff" stroke-width="2"/>
        <circle cx="23" cy="16" r="4" fill="none" stroke="#fff" stroke-width="2"/>
        <path d="M5 16 L10 8 L18 8 L23 16" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
        <path d="M14 8 L16 4 L20 4" fill="none" stroke="#fff" stroke-width="2"/>
        <circle cx="20" cy="4" r="1.5" fill="#fff"/>
      </g>
    </svg>`
    const icon = new window.H.map.Icon(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      { size: { w: 44, h: 44 }, anchor: { x: 22, y: 22 } }
    )
    return new window.H.map.Marker({ lat, lng }, { icon })
  }

  const size = 34
  svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="15" fill="${color}" stroke="#fff" stroke-width="3"/>
    <text x="17" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff" font-family="sans-serif">${label}</text>
  </svg>`

  const icon = new window.H.map.Icon(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    { size: { w: size, h: size }, anchor: { x: size / 2, y: size / 2 } }
  )
  return new window.H.map.Marker({ lat, lng }, { icon })
}
