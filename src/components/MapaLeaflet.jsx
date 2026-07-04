import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const EMOJI_ESPECIE = { perro: '🐕', gato: '🐈', otro: '🐾' }

// Ícono de pin (divIcon). Muestra: emoji de especie, o número (label), o punto.
function pin(color, label, especie) {
  let centro
  if (especie) {
    centro = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);font-size:15px;line-height:1">${EMOJI_ESPECIE[especie] || '🐾'}</div>`
  } else if (label != null) {
    centro = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);color:#fff;font:800 12px Nunito,sans-serif">${label}</div>`
  } else {
    centro = `<div style="width:9px;height:9px;border-radius:50%;background:#fff;position:absolute;top:5px;left:5px"></div>`
  }
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 3px 9px rgba(0,0,0,.4);position:relative">${centro}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 29],
  })
}

const COLOR = { perdido: '#ff5747', encontrado: '#2f7fed', avistamiento: '#1f9d8f', encasa: '#e0a300' }

/**
 * Mapa reutilizable.
 *  - center: [lat, lng]
 *  - zoom: número
 *  - marcadores: [{ id, lat, lng, tipo }]
 *  - interactivo: permite arrastrar/zoom (false = mapa fijo, para vistas chicas)
 *  - onMarcadorClick(id): al tocar un pin
 *  - onMapaClick({lat,lng}): al tocar el mapa (para elegir ubicación)
 */
export default function MapaLeaflet({
  center,
  zoom = 14,
  marcadores = [],
  linea = null, // array de [lat,lng] para dibujar un recorrido
  interactivo = true,
  recentrar = false, // muestra un botón para volver al centro (pin)
  ajustar = false, // encuadra el mapa para que entren todos los pines
  miUbi = null, // [lat,lng] de "mi ubicación" (punto azul)
  onGps = null, // botón GPS que deja el pin en mi ubicación (al publicar)
  zona = null, // [lat,lng] de la zona del aviso: muestra un botón para volver ahí
  zonaColor = '#ff5747', // color del botón de zona (según el tipo de aviso)
  onMarcadorClick,
  onMapaClick,
  style,
}) {
  const contRef = useRef(null)
  const mapRef = useRef(null)
  const capaRef = useRef(null)
  const ubiRef = useRef(null)

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (mapRef.current || !contRef.current) return
    const m = L.map(contRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: interactivo,
      scrollWheelZoom: interactivo,
      doubleClickZoom: interactivo,
      touchZoom: interactivo,
      keyboard: interactivo,
      boxZoom: interactivo,
    }).setView(center, zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m)
    capaRef.current = L.layerGroup().addTo(m)
    mapRef.current = m

    // Leaflet a veces necesita recalcular tamaño cuando el contenedor recién apareció.
    setTimeout(() => m.invalidateSize(), 250)

    return () => {
      m.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reaccionar al click en el mapa.
  useEffect(() => {
    const m = mapRef.current
    if (!m || !onMapaClick) return
    const handler = (e) => onMapaClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    m.on('click', handler)
    return () => m.off('click', handler)
  }, [onMapaClick])

  // Recentrar si cambia el center.
  useEffect(() => {
    if (mapRef.current && center) mapRef.current.setView(center, zoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1]])

  // Redibujar marcadores y el recorrido cuando cambian.
  useEffect(() => {
    const capa = capaRef.current
    if (!capa) return
    capa.clearLayers()
    // Línea del recorrido (punteada) primero, para que quede debajo de los pines.
    if (linea && linea.length > 1) {
      L.polyline(linea, { color: '#ff5747', weight: 3, dashArray: '6,8', opacity: 0.85 }).addTo(capa)
    }
    marcadores.forEach((mk) => {
      const marker = L.marker([mk.lat, mk.lng], { icon: pin(mk.color || COLOR[mk.tipo] || '#ff5747', mk.label, mk.especie) })
      if (mk.popup) marker.bindPopup(mk.popup, { closeButton: false, offset: [0, -8] })
      if (onMarcadorClick) marker.on('click', () => onMarcadorClick(mk.id))
      capa.addLayer(marker)
    })
    // Encuadrar para que entren todos los pines (cuando hay más de uno).
    if (ajustar && mapRef.current && marcadores.length > 1) {
      try {
        mapRef.current.fitBounds(
          marcadores.map((mk) => [mk.lat, mk.lng]),
          { padding: [45, 45], maxZoom: 16 }
        )
      } catch (e) {
        /* ignore */
      }
    }
  }, [marcadores, linea, ajustar, onMarcadorClick])

  // "Mi ubicación": punto azul + centrar cuando llega.
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    if (!miUbi) {
      if (ubiRef.current) {
        ubiRef.current.remove()
        ubiRef.current = null
      }
      return
    }
    const icon = L.divIcon({
      className: '',
      html:
        '<div style="width:18px;height:18px;border-radius:50%;background:#2f80ed;border:3px solid #fff;box-shadow:0 0 0 5px rgba(47,128,237,.22)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })
    if (ubiRef.current) ubiRef.current.setLatLng(miUbi)
    else ubiRef.current = L.marker(miUbi, { icon }).addTo(m)
    m.setView(miUbi, 15)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miUbi && miUbi[0], miUbi && miUbi[1]])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <div ref={contRef} style={{ width: '100%', height: '100%' }} />
      {recentrar && (
        <button
          type="button"
          className="map-recenter"
          onClick={() => mapRef.current && center && mapRef.current.setView(center, mapRef.current.getZoom())}
          aria-label="Centrar el mapa"
        >
          <span className="mi" style={{ fontSize: 22, color: '#1f9d8f' }}>
            my_location
          </span>
        </button>
      )}
      {zona && (
        <button
          type="button"
          className="map-recenter arriba"
          onClick={() => mapRef.current && mapRef.current.setView(zona, mapRef.current.getZoom())}
          aria-label="Ir a la zona del aviso"
        >
          <span className="mi fill" style={{ fontSize: 22, color: zonaColor }}>
            location_on
          </span>
        </button>
      )}
      {onGps && (
        <button
          type="button"
          className="map-recenter"
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(
              (p) => {
                const c = { lat: p.coords.latitude, lng: p.coords.longitude }
                onGps(c)
                if (mapRef.current) mapRef.current.setView([c.lat, c.lng], 16)
              },
              () => {},
              { enableHighAccuracy: true, timeout: 8000 }
            )
          }}
          aria-label="Usar mi ubicación"
        >
          <span className="mi" style={{ fontSize: 22, color: '#2f80ed' }}>
            my_location
          </span>
        </button>
      )}
    </div>
  )
}
