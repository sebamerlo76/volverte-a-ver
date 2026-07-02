import { useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { NOMBRES_BARRIOS, coordsDeBarrio } from '../lib/parana.js'
import { addReporte, subirFoto } from '../data/store.js'

export default function Publicar({ onCerrar, onPublicado, onToast }) {
  const [tipo, setTipo] = useState('perdido')
  const [especie, setEspecie] = useState('perro')
  const [foto, setFoto] = useState('') // vista previa (data URL)
  const [fotoFile, setFotoFile] = useState(null) // archivo real a subir
  const [nombre, setNombre] = useState('')
  const [zona, setZona] = useState('Centro')
  const [fecha, setFecha] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [guardando, setGuardando] = useState(false)

  const centro = coordsDeBarrio(zona)

  function elegirFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFoto(URL.createObjectURL(file)) // vista previa instantánea
  }

  async function publicar() {
    if (!whatsapp.trim()) {
      onToast('Poné un WhatsApp de contacto 🙏')
      return
    }
    setGuardando(true)
    try {
      const fotoUrl = await subirFoto(fotoFile)
      const nuevo = await addReporte({
        tipo,
        especie,
        nombre: nombre.trim() || null,
        zona,
        referencia: zona,
        color: '',
        tamano: '',
        raza: '',
        descripcion: descripcion.trim(),
        foto: fotoUrl,
        whatsapp: whatsapp.trim(),
        fechaEvento: fecha || new Date().toISOString().slice(0, 10),
      })
      onPublicado(nuevo)
    } catch (e) {
      console.error('No se pudo publicar:', e)
      onToast('No se pudo publicar 😕 revisá la conexión')
      setGuardando(false)
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          close
        </button>
        <div className="ftitle">Publicar reporte</div>
      </div>

      <div className="body form-body">
        <div className="seg">
          <button className={'segb p' + (tipo === 'perdido' ? ' on' : '')} onClick={() => setTipo('perdido')}>
            <span className="mi" style={{ fontSize: 19 }}>
              error_outline
            </span>
            Perdí a mi mascota
          </button>
          <button className={'segb e' + (tipo === 'encontrado' ? ' on' : '')} onClick={() => setTipo('encontrado')}>
            <span className="mi" style={{ fontSize: 19 }}>
              check_circle
            </span>
            Encontré una
          </button>
        </div>

        <div className="flabel">Especie</div>
        <div className="spec">
          {[
            { k: 'perro', ic: 'pets', t: 'Perro', fill: true },
            { k: 'gato', ic: 'pets', t: 'Gato' },
            { k: 'otro', ic: 'more_horiz', t: 'Otro' },
          ].map((op) => (
            <button key={op.k} className={'specb' + (especie === op.k ? ' on' : '')} onClick={() => setEspecie(op.k)}>
              <span className={'mi' + (op.fill && especie === op.k ? ' fill' : '')} style={{ fontSize: 23 }}>
                {op.ic}
              </span>
              {op.t}
            </button>
          ))}
        </div>

        <div className="flabel">Foto</div>
        <label className="photo-up">
          {foto ? (
            <img src={foto} alt="Foto elegida" />
          ) : (
            <>
              <span className="mi" style={{ fontSize: 26 }}>
                photo_camera
              </span>
              Agregar
            </>
          )}
          <input type="file" accept="image/*" onChange={elegirFoto} style={{ display: 'none' }} />
        </label>

        <div className="flabel">Nombre (si lo sabés)</div>
        <div className="inp">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Rocco" />
        </div>

        <div className="flabel">Zona / barrio</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
            location_on
          </span>
          <select value={zona} onChange={(e) => setZona(e.target.value)}>
            {NOMBRES_BARRIOS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="mappick">
          <MapaLeaflet center={centro} zoom={14} interactivo={false} marcadores={[{ id: 'nuevo', lat: centro[0], lng: centro[1], tipo }]} />
          <div className="hint">Elegí el barrio arriba para ubicar la zona</div>
        </div>

        <div className="flabel">Fecha</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
            calendar_today
          </span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="flabel">Descripción y señas</div>
        <textarea
          className="ta"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Color, tamaño, raza, collar, señas particulares…"
        />

        <div className="flabel">WhatsApp de contacto</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#25D366' }}>
            chat
          </span>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 343 412 3456" inputMode="tel" />
        </div>
        <div style={{ height: 24 }} />
      </div>

      <div className="fsubmit">
        <button className="btn-pub" onClick={publicar} disabled={guardando}>
          <span className="mi" style={{ fontSize: 23 }}>
            campaign
          </span>
          {guardando ? 'Publicando…' : 'Publicar reporte'}
        </button>
      </div>
    </div>
  )
}
