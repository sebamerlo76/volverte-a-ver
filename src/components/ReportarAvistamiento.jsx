import { useState } from 'react'
import MapaLeaflet from './MapaLazy.jsx'
import SelectChips from './SelectChips.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import BuscarDireccion from './BuscarDireccion.jsx'
import { puntoDeReporte } from '../lib/parana.js'
import { ubicacionTexto } from '../lib/localidades.js'
import { addAvistamiento, subirFotos } from '../data/store.js'
import { nombreMostrado } from '../lib/formato.js'
import { puedeEnviarAvist, registrarEnvioAvist } from '../lib/antispam.js'
import { tieneGroseria } from '../lib/moderacion.js'
import { TIPOS_APORTE, tipoAporte } from '../lib/aportes.js'

export default function ReportarAvistamiento({ reporte, onCerrar, onEnviado, onToast }) {
  const c = puntoDeReporte(reporte)
  const [tipo, setTipo] = useState(null) // null = elegiendo qué aporta
  const [punto, setPunto] = useState({ lat: c[0], lng: c[1] })
  const [nota, setNota] = useState('')
  const [autor, setAutor] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [fotos, setFotos] = useState([]) // 1 foto opcional del lugar
  const [trampa, setTrampa] = useState('') // honeypot: si se completa, es un bot
  const [guardando, setGuardando] = useState(false)

  const cfg = tipo ? tipoAporte(tipo) : null

  function elegir(k) {
    setTipo(k)
    setNota('') // los chips cambian según el tipo
  }

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
      // La foto es opcional: si la subida falla, no bloqueamos el aporte.
      let foto = ''
      try {
        const urls = await subirFotos(fotos)
        foto = urls[0] || ''
      } catch (e) {
        console.warn('No se pudo subir la foto del aporte:', e)
      }
      // Los aportes que no marcan lugar guardan el punto de la zona del aviso: así no
      // dependemos de que lat/lng acepten nulos. El mapa los filtra por tipo.
      await addAvistamiento({
        reporteId: reporte.id,
        lat: cfg.mapa ? punto.lat : c[0],
        lng: cfg.mapa ? punto.lng : c[1],
        nota: nota.trim(),
        autor: autor.trim() || 'Anónimo',
        whatsapp: whatsapp.trim(),
        foto,
        tipo,
      })
      registrarEnvioAvist()
      onEnviado()
    } catch (e) {
      console.error(e)
      onToast('No se envió. Reintentá en un toque 🔄')
      setGuardando(false)
    }
  }

  // --- Paso 1: qué aporta ---
  if (!tipo) {
    return (
      <div className="view">
        <div className="fhead">
          <button className="mi close" onClick={onCerrar}>
            arrow_back
          </button>
          <div className="ftitle">Aportar un dato</div>
        </div>
        <div className="body form-body">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', margin: '6px 0 14px', lineHeight: 1.5 }}>
            ¿Qué sabés de <b>{nombreMostrado(reporte)}</b>? Cualquier dato ayuda a la familia. 🐾
          </div>
          <div className="aporte-tipos">
            {TIPOS_APORTE.map((op) => (
              <button key={op.k} className="aporte-op" onClick={() => elegir(op.k)}>
                <span className="aporte-op-ic" style={{ background: op.color }}>
                  <span className="mi fill" style={{ fontSize: 22 }}>
                    {op.ic}
                  </span>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="aporte-op-t">{op.t}</span>
                  <span className="aporte-op-d">{op.d}</span>
                </span>
                <span className="mi" style={{ fontSize: 22, color: '#c3b8b0' }}>
                  chevron_right
                </span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--faint)', marginTop: 14, lineHeight: 1.5 }}>
            La familia recibe un aviso con lo que cuentes. Si dejás tu WhatsApp, pueden escribirte para coordinar.
          </div>
        </div>
      </div>
    )
  }

  // --- Paso 2: el detalle del aporte ---
  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={() => setTipo(null)}>
          arrow_back
        </button>
        <div className="ftitle">{cfg.titulo}</div>
      </div>

      <div className="body form-body">
        {cfg.mapa ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', margin: '6px 0 10px', lineHeight: 1.5 }}>
              Marcá dónde {tipo === 'peligro' ? 'está' : 'viste a'} <b>{nombreMostrado(reporte)}</b>. Buscá la calle o tocá
              el mapa para mover el pin al lugar exacto.
            </div>

            <BuscarDireccion localidad={reporte.localidad} onEncontrado={(p) => setPunto(p)} onToast={onToast} />

            <div style={{ height: 240, borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--line)', marginTop: 8 }}>
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
                    popup: `<b style="font-family:Nunito,sans-serif">${reporte.tipo === 'perdido' ? 'Se perdió acá' : 'Se encontró acá'}</b><br><span style="font-family:Nunito,sans-serif;font-size:12px;color:#8a807a">${ubicacionTexto(reporte.localidad, reporte.zona)}</span>`,
                  },
                  { id: 'p', lat: punto.lat, lng: punto.lng, tipo: 'avistamiento' },
                ]}
              />
            </div>
            <div className="avist-ref">
              <span>
                <span className="dot" style={{ background: '#ff5747' }} /> Donde se{' '}
                {reporte.tipo === 'perdido' ? 'perdió' : 'encontró'}
              </span>
              <span>
                <span className="dot" style={{ background: '#1f9d8f' }} /> {tipo === 'peligro' ? 'Dónde está' : 'Donde lo viste'}{' '}
                (movés vos)
              </span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', margin: '6px 0 10px', lineHeight: 1.5 }}>
            {tipo === 'duenio' ? (
              <>
                Contá lo que sepas de la familia de <b>{nombreMostrado(reporte)}</b> — la calle, una referencia, cómo lo
                conocés. Eso puede cerrar la búsqueda hoy mismo. 🏠
              </>
            ) : (
              <>
                Avisale a quien publicó que <b>{nombreMostrado(reporte)}</b> tiene familia y suele volver solo. Así no
                buscan de más ni se preocupan al vicio. 🔁
              </>
            )}
          </div>
        )}

        <div className="flabel">{cfg.pregunta}</div>
        <SelectChips opciones={cfg.chips} valor={nota} onChange={setNota} otro placeholder="Contá algo más…" />

        <div className="flabel">Tu nombre (para que puedan agradecerte)</div>
        <div className="inp">
          <input value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Ej: Vecino de la zona" />
        </div>

        <div className="flabel">Tu WhatsApp (opcional, para que la familia te escriba)</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#25D366' }}>
            chat
          </span>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 343 412 3456" inputMode="tel" />
        </div>

        {cfg.mapa && (
          <>
            <div className="flabel">Foto del lugar (opcional)</div>
            <PhotoPicker value={fotos} onChange={setFotos} max={1} />
          </>
        )}

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
        <button className="btn-pub" style={{ background: cfg.color }} onClick={enviar} disabled={guardando}>
          <span className="mi" style={{ fontSize: 23 }}>
            {cfg.ic}
          </span>
          {guardando ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
