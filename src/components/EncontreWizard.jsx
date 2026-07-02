import { useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { NOMBRES_BARRIOS, coordsDeBarrio } from '../lib/parana.js'
import { addReporte, subirFoto } from '../data/store.js'

const TAMANOS = ['Chico', 'Mediano', 'Grande']
const TOTAL = 5
const TITULOS = [
  '¿Qué animal es?',
  '¿Cómo es?',
  'Una foto (si podés)',
  '¿Dónde y cuándo?',
  '¿Cómo te contactan?',
]

export default function EncontreWizard({ onCerrar, onPublicado, onToast }) {
  const [paso, setPaso] = useState(1)
  const [especie, setEspecie] = useState('perro')
  const [color, setColor] = useState('')
  const [tamano, setTamano] = useState('')
  const [sexo, setSexo] = useState('')
  const [edad, setEdad] = useState('')
  const [collar, setCollar] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState('')
  const [fotoFile, setFotoFile] = useState(null)
  const [zona, setZona] = useState('Centro')
  const [fecha, setFecha] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [guardando, setGuardando] = useState(false)

  const centro = coordsDeBarrio(zona)

  function elegirFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFoto(URL.createObjectURL(file))
  }

  function atras() {
    if (paso === 1) onCerrar()
    else setPaso(paso - 1)
  }
  function siguiente() {
    setPaso(Math.min(TOTAL, paso + 1))
  }

  async function publicar() {
    if (!whatsapp.trim()) {
      onToast('Poné un WhatsApp de contacto 🙏')
      return
    }
    setGuardando(true)
    try {
      const fotoUrl = fotoFile ? await subirFoto(fotoFile) : ''
      await addReporte({
        tipo: 'encontrado',
        especie,
        nombre: null,
        zona,
        referencia: zona,
        color: color.trim(),
        tamano,
        raza: '',
        sexo,
        edad: edad.trim(),
        collar: collar.trim(),
        descripcion: descripcion.trim(),
        foto: fotoUrl,
        whatsapp: whatsapp.trim(),
        fechaEvento: fecha || new Date().toISOString().slice(0, 10),
      })
      onPublicado()
    } catch (e) {
      console.error(e)
      onToast('No se pudo publicar 😕')
      setGuardando(false)
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={atras}>
          {paso === 1 ? 'close' : 'arrow_back'}
        </button>
        <div className="ftitle">Encontré una</div>
      </div>

      <div className="wiz-prog">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={'wiz-dot' + (n <= paso ? ' on' : '')} />
        ))}
      </div>

      <div className="body form-body">
        <div className="wiz-titulo">{TITULOS[paso - 1]}</div>

        {paso === 1 && (
          <div className="spec">
            {[
              { k: 'perro', ic: 'pets', t: 'Perro', fill: true },
              { k: 'gato', ic: 'pets', t: 'Gato' },
              { k: 'otro', ic: 'more_horiz', t: 'Otro' },
            ].map((op) => (
              <button
                key={op.k}
                className={'specb' + (especie === op.k ? ' on' : '')}
                style={{ height: 88 }}
                onClick={() => setEspecie(op.k)}
              >
                <span className={'mi' + (op.fill && especie === op.k ? ' fill' : '')} style={{ fontSize: 30 }}>
                  {op.ic}
                </span>
                {op.t}
              </button>
            ))}
          </div>
        )}

        {paso === 2 && (
          <>
            <div className="flabel">Color</div>
            <div className="inp">
              <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ej: Marrón con blanco" />
            </div>
            <div className="flabel">Tamaño</div>
            <div className="seg" style={{ background: 'transparent', padding: 0, gap: 9 }}>
              {TAMANOS.map((t) => (
                <button
                  key={t}
                  className={'specb' + (tamano === t ? ' on' : '')}
                  style={{ height: 46, flexDirection: 'row' }}
                  onClick={() => setTamano(tamano === t ? '' : t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flabel">Sexo</div>
            <div className="seg" style={{ background: 'transparent', padding: 0, gap: 9 }}>
              <button className={'specb' + (sexo === 'macho' ? ' on' : '')} style={{ height: 46, flexDirection: 'row' }} onClick={() => setSexo(sexo === 'macho' ? '' : 'macho')}>
                ♂ Macho
              </button>
              <button className={'specb' + (sexo === 'hembra' ? ' on' : '')} style={{ height: 46, flexDirection: 'row' }} onClick={() => setSexo(sexo === 'hembra' ? '' : 'hembra')}>
                ♀ Hembra
              </button>
            </div>
            <div className="flabel">Collar / chapita</div>
            <div className="inp">
              <input value={collar} onChange={(e) => setCollar(e.target.value)} placeholder="Ej: Collar rojo" />
            </div>
            <div className="flabel">Señas particulares</div>
            <textarea
              className="ta"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Collar, raza aproximada, si es manso o asustadizo…"
            />
          </>
        )}

        {paso === 3 && (
          <>
            <label className="photo-up" style={{ width: '100%', height: 160 }}>
              {foto ? (
                <img src={foto} alt="Foto" />
              ) : (
                <>
                  <span className="mi" style={{ fontSize: 30 }}>
                    photo_camera
                  </span>
                  Tocá para agregar una foto
                </>
              )}
              <input type="file" accept="image/*" onChange={elegirFoto} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
              La foto ayuda muchísimo a que la familia la reconozca. Si no tenés, podés seguir igual.
            </div>
          </>
        )}

        {paso === 4 && (
          <>
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
              <MapaLeaflet
                center={centro}
                zoom={14}
                interactivo={false}
                marcadores={[{ id: 'nuevo', lat: centro[0], lng: centro[1], tipo: 'encontrado' }]}
              />
              <div className="hint">Elegí el barrio para ubicar la zona</div>
            </div>
            <div className="flabel">Fecha</div>
            <div className="inp">
              <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
                calendar_today
              </span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </>
        )}

        {paso === 5 && (
          <>
            <div className="flabel">WhatsApp de contacto</div>
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
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
              Cuando la familia vea el aviso, te va a escribir por acá. 🐾
            </div>
          </>
        )}

        <div style={{ height: 20 }} />
      </div>

      <div className="fsubmit">
        {paso < TOTAL ? (
          <button className="btn-pub" onClick={siguiente}>
            Siguiente
            <span className="mi" style={{ fontSize: 22 }}>
              chevron_right
            </span>
          </button>
        ) : (
          <button className="btn-pub" onClick={publicar} disabled={guardando}>
            <span className="mi" style={{ fontSize: 23 }}>
              campaign
            </span>
            {guardando ? 'Publicando…' : 'Publicar'}
          </button>
        )}
      </div>
    </div>
  )
}
