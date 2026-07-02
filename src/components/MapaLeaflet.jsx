import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Ícono de pin dibujado con CSS (divIcon), así no dependemos de imágenes.
function pin(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 3px 9px rgba(0,0,0,.4)"><div style="width:9px;height:9px;border-radius:50%;background:#fff;position:absolute;top:5px;left:5px"></div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 25],
  })
}

const COLOR = { perdido: '#ff5747', encontrado: '#17a06b' }

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
  interactivo = true,
  onMarcadorClick,
  onMapaClick,
  style,
}) {
  const contRef = useRef(null)
  const mapRef = useRef(null)
  const capaRef = useRef(null)

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

  // Redibujar marcadores cuando cambian.
  useEffect(() => {
    const capa = capaRef.current
    if (!capa) return
    capa.clearLayers()
    marcadores.forEach((mk) => {
      const marker = L.marker([mk.lat, mk.lng], { icon: pin(COLOR[mk.tipo] || '#ff5747') })
      if (onMarcadorClick) marker.on('click', () => onMarcadorClick(mk.id))
      capa.addLayer(marker)
    })
  }, [marcadores, onMarcadorClick])

  return <div ref={contRef} style={{ width: '100%', height: '100%', ...style }} />
}
