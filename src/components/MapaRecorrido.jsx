import { useEffect, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { puntoDeReporte } from '../lib/parana.js'
import { getAvistamientos } from '../data/store.js'
import { nombreMostrado } from '../lib/formato.js'
import { popupAvist } from './Detalle.jsx'

// Mapa a pantalla completa para explorar el recorrido (movible y con zoom).
export default function MapaRecorrido({ reporte, onCerrar }) {
  const [avist, setAvist] = useState([])

  useEffect(() => {
    if (!reporte?.id) return
    let vivo = true
    getAvistamientos(reporte.id)
      .then((a) => vivo && setAvist(a))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [reporte?.id])

  const centro = puntoDeReporte(reporte)
  const marcadores = [
    { id: 'zona', lat: centro[0], lng: centro[1], tipo: reporte.tipo, especie: reporte.especie },
    ...avist.map((a, i) => ({
      id: a.id,
      lat: a.lat,
      lng: a.lng,
      tipo: 'avistamiento',
      label: i + 1,
      popup: popupAvist(a, i + 1),
    })),
  ]
  const linea = [centro, ...avist.map((a) => [a.lat, a.lng])]

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          arrow_back
        </button>
        <div className="ftitle">Recorrido de {nombreMostrado(reporte)}</div>
      </div>

      <div className="mapwrap">
        <MapaLeaflet
          center={centro}
          zoom={14}
          interactivo
          recentrar
          ajustar
          marcadores={marcadores}
          linea={linea}
          style={{ position: 'absolute', inset: 0 }}
        />
        <div className="mlegend">
          <div className="l" style={{ background: '#ff5747' }}>Zona del aviso</div>
          <div className="l" style={{ background: '#1f9d8f' }}>
            {avist.length} visto{avist.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>
  )
}
