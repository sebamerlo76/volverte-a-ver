import { useMemo, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { PARANA_CENTER, coordsDeBarrio } from '../lib/parana.js'
import { nombreMostrado, tiempoRelativo } from '../lib/formato.js'

export default function Mapa({ reportes, onAbrir, onToast }) {
  const [sel, setSel] = useState(reportes[0]?.id || null)

  const marcadores = useMemo(
    () =>
      reportes.map((r) => {
        const c = coordsDeBarrio(r.zona)
        return { id: r.id, lat: c[0], lng: c[1], tipo: r.tipo }
      }),
    [reportes]
  )

  const perdidos = reportes.filter((r) => r.tipo === 'perdido').length
  const encontrados = reportes.filter((r) => r.tipo === 'encontrado').length
  const seleccionado = reportes.find((r) => r.id === sel)

  return (
    <div className="view">
      <div className="mapwrap">
        <MapaLeaflet
          center={PARANA_CENTER}
          zoom={13.4}
          marcadores={marcadores}
          onMarcadorClick={(id) => setSel(id)}
          style={{ position: 'absolute', inset: 0 }}
        />

        <div className="mtop">
          <div className="s">
            <span className="mi" style={{ fontSize: 20, color: '#c9beb6' }}>
              search
            </span>
            Buscar en el mapa…
          </div>
          <button
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background: 'rgba(255,255,255,.96)',
              border: '1.5px solid #efe4db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(80,50,30,.14)',
            }}
          >
            <span className="mi" style={{ fontSize: 22, color: '#5a5049' }}>
              tune
            </span>
          </button>
        </div>

        <div className="mlegend">
          <div className="l" style={{ background: '#ff5747' }}>
            Perdidos · {perdidos}
          </div>
          <div className="l" style={{ background: '#17a06b' }}>
            Encontrados · {encontrados}
          </div>
        </div>

        <button className="mloc" onClick={() => onToast('📍 Centraría el mapa en tu ubicación')}>
          <span className="mi" style={{ fontSize: 24, color: '#1f9d8f' }}>
            my_location
          </span>
        </button>

        {seleccionado ? (
          <button className="mcard" onClick={() => onAbrir(seleccionado.id)}>
            {seleccionado.foto ? (
              <img src={seleccionado.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
            ) : (
              <div className="noimg" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: seleccionado.tipo === 'perdido' ? '#ff5747' : '#17a06b',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: seleccionado.tipo === 'perdido' ? '#ff5747' : '#17a06b',
                  }}
                >
                  {seleccionado.tipo.toUpperCase()} · {tiempoRelativo(seleccionado.creadoEn)}
                </span>
              </div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17, marginTop: 1 }}>
                {nombreMostrado(seleccionado)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#8a807a' }}>{seleccionado.zona}</div>
            </div>
          </button>
        ) : null}
      </div>
    </div>
  )
}
