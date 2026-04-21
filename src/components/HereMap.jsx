import { useEffect, useRef } from 'react'

const API_KEY = import.meta.env.VITE_HERE_API_KEY

/**
 * HERE Maps component.
 *
 * Props:
 *   markers    — [{ lat, lng, label, color, live? }]  live=true → smooth position update
 *   route      — { pickup: {lat,lng}, dropoff: {lat,lng} }
 *   center     — { lat, lng }
 *   zoom       — number (default 13)
 *   height     — CSS string (default '420px')
 *   onMapClick — (lat, lng) => void
 */
export default function HereMap({ markers = [], route, center, zoom = 13, height = '420px', onMapClick }) {
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const platformRef   = useRef(null)
  const rafRef        = useRef(null)

  // Separate refs so route polylines are never wiped by marker updates
  const markerObjsRef = useRef([])   // H.map.Marker objects
  const routeObjsRef  = useRef([])   // H.map.Polyline objects
  const liveMarkerRef = useRef(null) // ref to the rider's live marker for in-place updates

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return
    if (!API_KEY || API_KEY === 'your_here_api_key_here') return

    rafRef.current = requestAnimationFrame(() => {
      const el = containerRef.current
      if (!el || !window.H) return

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
        mapRef.current     = null
        platformRef.current = null
        markerObjsRef.current = []
        routeObjsRef.current  = []
        liveMarkerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function initMap(el) {
    try {
      const platform = new window.H.service.Platform({ apikey: API_KEY })
      platformRef.current = platform

      const layers  = platform.createDefaultLayers()
      const initial = center ?? (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: -1.2921, lng: 36.8219 })

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
      map._ro = ro

      if (onMapClick) {
        map.addEventListener('tap', (evt) => {
          try {
            const coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY)
            onMapClick(coord.lat, coord.lng)
          } catch {}
        })
      }

      syncMarkers(map, true)
      if (route?.pickup?.lat && route?.dropoff?.lat) drawRoute(map, platform)
    } catch (err) {
      console.warn('HereMap init failed:', err)
    }
  }

  // ── Markers ── only updates marker objects, never touches route polylines ──
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.H) return
    syncMarkers(map, false)
  }, [markers]) // eslint-disable-line react-hooks/exhaustive-deps

  function syncMarkers(map, isInit) {
    const prev = liveMarkerRef.current

    // Remove stale non-live marker objects
    markerObjsRef.current.forEach(obj => {
      if (obj !== prev) {
        try { map.removeObject(obj) } catch {}
      }
    })
    markerObjsRef.current = []

    if (!markers.length) {
      if (prev) {
        try { map.removeObject(prev) } catch {}
        liveMarkerRef.current = null
      }
      return
    }

    let hasNonLive = false

    markers.forEach(m => {
      if (m.lat == null || m.lng == null) return

      if (m.live) {
        if (prev) {
          // Smooth: just move the existing marker, no remove/add
          try { prev.setGeometry({ lat: m.lat, lng: m.lng }) } catch {}
          markerObjsRef.current.push(prev)
        } else {
          try {
            const marker = buildMarker(m)
            map.addObject(marker)
            liveMarkerRef.current = marker
            markerObjsRef.current.push(marker)
          } catch {}
        }
      } else {
        try {
          const marker = buildMarker(m)
          map.addObject(marker)
          markerObjsRef.current.push(marker)
          hasNonLive = true
        } catch {}
      }
    })

    // Fit viewport only on first load or when pickup/dropoff markers change
    // — not on every live position update, so the user can freely pan the map
    if (isInit || hasNonLive) {
      fitViewport(map)
    }
  }

  function fitViewport(map) {
    const all = [...markerObjsRef.current, ...routeObjsRef.current]
    if (!all.length) return
    try {
      const lats = markers.map(m => m.lat).filter(Boolean)
      const lngs = markers.map(m => m.lng).filter(Boolean)
      if (!lats.length) return
      if (lats.length === 1) {
        map.setCenter({ lat: lats[0], lng: lngs[0] }, true)
      } else {
        const bbox = new window.H.geo.Rect(
          Math.max(...lats), Math.min(...lngs),
          Math.min(...lats), Math.max(...lngs)
        )
        map.getViewModel().setLookAtData({ bounds: bbox, padding: { top: 70, bottom: 70, left: 50, right: 50 } }, true)
      }
    } catch {}
  }

  // ── Route ─── stored separately so marker syncs never clear it ───────────
  useEffect(() => {
    const map      = mapRef.current
    const platform = platformRef.current
    if (!map || !platform || !window.H) return
    if (!route?.pickup?.lat || !route?.dropoff?.lat) return
    drawRoute(map, platform)
  }, [route?.pickup?.lat, route?.pickup?.lng, route?.dropoff?.lat, route?.dropoff?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  function drawRoute(map, platform) {
    // Clear previous route polylines only
    routeObjsRef.current.forEach(obj => {
      try { map.removeObject(obj) } catch {}
    })
    routeObjsRef.current = []

    const router = platform.getRoutingService(null, 8)
    router.calculateRoute(
      {
        routingMode:   'fast',
        transportMode: 'car',
        origin:        `${route.pickup.lat},${route.pickup.lng}`,
        destination:   `${route.dropoff.lat},${route.dropoff.lng}`,
        return:        'polyline',
      },
      (result) => {
        const polylineStr = result.routes?.[0]?.sections?.[0]?.polyline
        if (!polylineStr) return
        try {
          const linestring = window.H.geo.LineString.fromFlexiblePolyline(polylineStr)
          const routeLine  = new window.H.map.Polyline(linestring, {
            style: { strokeColor: '#FF5E14', lineWidth: 5, lineDash: [0] },
          })
          map.addObject(routeLine)
          routeObjsRef.current.push(routeLine)
          // Fit to route bounds (includes all markers too)
          fitViewport(map)
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

function buildMarker({ lat, lng, color = '#FF5E14', label = '' }) {
  const size = label === 'Me' ? 40 : 34

  // Rider (Me) gets a pulsing ring effect via a slightly different SVG
  const svg = label === 'Me'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="#fff" stroke-width="3" opacity="0.25"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-8}" fill="${color}" stroke="#fff" stroke-width="3"/>
        <text x="${size/2}" y="${size/2+5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#fff" font-family="sans-serif">Me</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="#fff" stroke-width="3"/>
        <text x="${size/2}" y="${size/2+5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff" font-family="sans-serif">${label}</text>
      </svg>`

  const icon = new window.H.map.Icon(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    { size: { w: size, h: size }, anchor: { x: size / 2, y: size / 2 } }
  )
  return new window.H.map.Marker({ lat, lng }, { icon })
}
