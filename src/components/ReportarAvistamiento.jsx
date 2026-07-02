import { useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import SelectChips from './SelectChips.jsx'
import { coordsDeBarrio } from '../lib/parana.js'
import { addAvistamiento } from '../data/store.js'
import { nombreMostrado } from '../lib/formato.js'

const NOTAS = ['Lo vi suelto', 'Alguien lo tiene', 'Cruzó la calle', 'Estaba asustado', 'Se dejó acercar']

export default function ReportarAvistamiento({ reporte, onCerrar, onEnviado, onToast }) {
  const c = coordsDeBarrio(reporte.zona)
  const [punto, setPunto] = useState({ lat: c[0], lng: c[1] })
  const [nota, setNota] = useState('')
  const [autor, setAutor] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function enviar() {
    setGuardando(true)
    try {
      await addAvistamiento({
        reporteId: reporte.id,
        lat: punto.lat,
        lng: punto.lng,
        nota: nota.trim(),
        autor: autor.trim() || 'Anónimo',
      })
      onEnviado()
    } catch (e) {
      console.error(e)
      onToast('No se pudo enviar 😕')
      setGuardando(false)
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          arrow_back
        </button>
        <div className="ftitle">¡Lo vi acá!</div>
      </div>

      <div className="body form-body">
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', margin: '6px 0 10px', lineHeight: 1.5 }}>
          Marcá dónde viste a <b>{nombreMostrado(reporte)}</b>. Tocá el mapa para mover el pin al lugar exacto.
        </div>

        <div style={{ height: 240, borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--line)' }}>
          <MapaLeaflet
            center={[punto.lat, punto.lng]}
            zoom={15}
            interactivo
            recentrar
            onMapaClick={setPunto}
            marcadores={[
              {
                id: 'zona',
                lat: c[0],
                lng: c[1],
                tipo: reporte.tipo,
                popup: `<b style="font-family:Nunito,sans-serif">${reporte.tipo === 'perdido' ? 'Se perdió acá' : 'Se encontró acá'}</b><br><span style="font-family:Nunito,sans-serif;font-size:12px;color:#8a807a">${reporte.zona}</span>`,
              },
              { id: 'p', lat: punto.lat, lng: punto.lng, tipo: 'avistamiento' },
            ]}
          />
        </div>
        <div className="avist-ref">
          <span>
            <span className="dot" style={{ background: '#ff5747' }} /> Donde se {reporte.tipo === 'perdido' ? 'perdió' : 'encontró'}
          </span>
          <span>
            <span className="dot" style={{ background: '#1f9d8f' }} /> Donde lo viste (movés vos)
          </span>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--faint)', marginTop: 7 }}>
          Tocá el mapa para poner tu pin donde lo viste. El botón <span className="mi" style={{ fontSize: 15, color: '#1f9d8f', verticalAlign: 'middle' }}>my_location</span> te vuelve a tu pin.
        </div>

        <div className="flabel">¿Cómo lo viste? (opcional)</div>
        <SelectChips opciones={NOTAS} valor={nota} onChange={setNota} otro placeholder="Contá algo más…" />

        <div className="flabel">Tu nombre (para que puedan agradecerte)</div>
        <div className="inp">
          <input value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Ej: Vecino de la zona" />
        </div>
        <div style={{ height: 24 }} />
      </div>

      <div className="fsubmit">
        <button className="btn-pub" style={{ background: 'var(--teal)' }} onClick={enviar} disabled={guardando}>
          <span className="mi" style={{ fontSize: 23 }}>
            visibility
          </span>
          {guardando ? 'Enviando…' : 'Enviar avistamiento'}
        </button>
      </div>
    </div>
  )
}
