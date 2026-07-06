import { useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import SelectChips from './SelectChips.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import { puntoDeReporte } from '../lib/parana.js'
import { addAvistamiento, subirFotos } from '../data/store.js'
import { nombreMostrado } from '../lib/formato.js'
import { puedeEnviarAvist, registrarEnvioAvist } from '../lib/antispam.js'
import { tieneGroseria } from '../lib/moderacion.js'

const NOTAS = ['Lo vi suelto', 'Alguien lo tiene', 'Cruzó la calle', 'Estaba asustado', 'Se dejó acercar']

export default function ReportarAvistamiento({ reporte, onCerrar, onEnviado, onToast }) {
  const c = puntoDeReporte(reporte)
  const [punto, setPunto] = useState({ lat: c[0], lng: c[1] })
  const [nota, setNota] = useState('')
  const [autor, setAutor] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [fotos, setFotos] = useState([]) // 1 foto opcional del lugar
  const [trampa, setTrampa] = useState('') // honeypot: si se completa, es un bot
  const [guardando, setGuardando] = useState(false)

  async function enviar() {
    // Honeypot: un humano no ve este campo; si vino lleno, es un bot → fingimos éxito.
    if (trampa) {
      onEnviado()
      return
    }
    if (tieneGroseria(`${nota} ${autor}`)) {
      onToast('Cuidá el lenguaje: sacá los insultos 🙏')
      return
    }
    // Rate-limit por dispositivo (frena doble-tap y abuso casual).
    const chequeo = puedeEnviarAvist()
    if (!chequeo.ok) {
      onToast(chequeo.motivo)
      return
    }
    setGuardando(true)
    try {
      // La foto es opcional: si la subida falla, no bloqueamos el avistamiento.
      let foto = ''
      try {
        const urls = await subirFotos(fotos)
        foto = urls[0] || ''
      } catch (e) {
        console.warn('No se pudo subir la foto del avistamiento:', e)
      }
      await addAvistamiento({
        reporteId: reporte.id,
        lat: punto.lat,
        lng: punto.lng,
        nota: nota.trim(),
        autor: autor.trim() || 'Anónimo',
        whatsapp: whatsapp.trim(),
        foto,
      })
      registrarEnvioAvist()
      onEnviado()
    } catch (e) {
      console.error(e)
      onToast('No se envió. Reintentá en un toque 🔄')
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
            onGps={setPunto}
            onMapaClick={setPunto}
            zona={c}
            zonaColor={reporte.tipo === 'perdido' ? '#ff5747' : '#2f7fed'}
            marcadores={[
              {
                id: 'zona',
                lat: c[0],
                lng: c[1],
                tipo: reporte.tipo,
                especie: reporte.especie,
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
          Tocá el mapa para poner tu pin donde lo viste. Los botones del mapa te llevan a la{' '}
          <span className="mi fill" style={{ fontSize: 15, color: reporte.tipo === 'perdido' ? '#ff5747' : '#2f7fed', verticalAlign: 'middle' }}>location_on</span> zona del aviso o a{' '}
          <span className="mi" style={{ fontSize: 15, color: '#2f80ed', verticalAlign: 'middle' }}>my_location</span> tu ubicación.
        </div>

        <div className="flabel">¿Cómo lo viste? (opcional)</div>
        <SelectChips opciones={NOTAS} valor={nota} onChange={setNota} otro placeholder="Contá algo más…" />

        <div className="flabel">Tu nombre (para que puedan agradecerte)</div>
        <div className="inp">
          <input value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Ej: Vecino de la zona" />
        </div>

        <div className="flabel">Tu WhatsApp (opcional, para que la familia te escriba)</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#25D366' }}>
            chat
          </span>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Ej: 343 412 3456"
            inputMode="tel"
          />
        </div>

        <div className="flabel">Foto del lugar (opcional)</div>
        <PhotoPicker value={fotos} onChange={setFotos} max={1} />

        {/* Campo trampa anti-bots: invisible para humanos, no tabulable */}
        <input
          type="text"
          value={trampa}
          onChange={(e) => setTrampa(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

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
