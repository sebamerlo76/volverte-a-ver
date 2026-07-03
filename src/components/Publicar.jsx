import { useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { NOMBRES_BARRIOS, coordsDeBarrio, puntoDeReporte } from '../lib/parana.js'
import { addReporte, actualizarReporte, addMascota, subirFoto } from '../data/store.js'
import SelectChips from './SelectChips.jsx'
import { COLORES, SEXOS, EDADES, COLLAR, TAMANOS } from '../lib/opciones.js'

export default function Publicar({ inicial, plantilla, ofrecerGuardar, onCerrar, onPublicado, onToast }) {
  const editando = !!inicial
  // base = datos para prellenar: un aviso a editar, o una mascota guardada ("Se me perdió").
  const base = inicial || plantilla || null
  const [tipo, setTipo] = useState(base?.tipo || 'perdido')
  const [especie, setEspecie] = useState(base?.especie || 'perro')
  const [foto, setFoto] = useState(base?.foto || '') // vista previa / foto actual
  const [fotoFile, setFotoFile] = useState(null) // archivo nuevo a subir (si cambia)
  const [nombre, setNombre] = useState(base?.nombre || '')
  const [color, setColor] = useState(base?.color || '')
  const [tamano, setTamano] = useState(base?.tamano || '')
  const [sexo, setSexo] = useState(base?.sexo || '')
  const [edad, setEdad] = useState(base?.edad || '')
  const [collar, setCollar] = useState(base?.collar || '')
  const [recompensa, setRecompensa] = useState(base?.recompensa || '')
  const [zona, setZona] = useState(base?.zona || 'Centro')
  const [fecha, setFecha] = useState(base?.fechaEvento || '')
  const [descripcion, setDescripcion] = useState(base?.descripcion || '')
  const [whatsapp, setWhatsapp] = useState(base?.whatsapp || '')
  const [guardarMasc, setGuardarMasc] = useState(true) // guardar en "Mis mascotas"
  const [guardando, setGuardando] = useState(false)

  const puntoIni =
    base?.lat != null && base?.lng != null ? [base.lat, base.lng] : coordsDeBarrio(base?.zona || 'Centro')
  const [punto, setPunto] = useState({ lat: puntoIni[0], lng: puntoIni[1] })

  function cambiarZona(z) {
    setZona(z)
    const c = coordsDeBarrio(z)
    setPunto({ lat: c[0], lng: c[1] }) // al cambiar el barrio, el pin va a esa zona
  }

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
      // Si no eligió foto nueva, se conserva la actual (importante al editar).
      const fotoUrl = fotoFile ? await subirFoto(fotoFile) : foto
      const datos = {
        tipo,
        especie,
        nombre: nombre.trim() || null,
        zona,
        referencia: zona,
        color,
        tamano,
        raza: base?.raza || '',
        sexo,
        edad: edad.trim(),
        collar: collar.trim(),
        recompensa: tipo === 'perdido' ? recompensa.trim() : '',
        descripcion: descripcion.trim(),
        foto: fotoUrl,
        whatsapp: whatsapp.trim(),
        fechaEvento: fecha || new Date().toISOString().slice(0, 10),
        mascotaId: base?.mascotaId ?? null,
        lat: punto.lat,
        lng: punto.lng,
      }
      if (editando) await actualizarReporte(inicial.id, datos)
      else await addReporte(datos)

      // Si vino de "cargar y publicar", guardamos también la mascota en el perfil.
      if (ofrecerGuardar && guardarMasc) {
        try {
          await addMascota({
            nombre: nombre.trim() || null,
            especie,
            color: '',
            tamano: '',
            raza: '',
            descripcion: descripcion.trim(),
            foto: fotoUrl,
          })
        } catch (e) {
          console.warn('No se pudo guardar la mascota en el perfil:', e)
        }
      }
      onPublicado()
    } catch (e) {
      console.error('No se pudo guardar:', e)
      onToast('No se pudo guardar 😕 revisá la conexión')
      setGuardando(false)
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          close
        </button>
        <div className="ftitle">{editando ? 'Editar aviso' : 'Publicar reporte'}</div>
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

        <div className="flabel">Color</div>
        <SelectChips opciones={COLORES} valor={color} onChange={setColor} otro placeholder="Otro color" />

        <div className="flabel">Tamaño</div>
        <SelectChips opciones={TAMANOS} valor={tamano} onChange={setTamano} />

        <div className="flabel">Sexo</div>
        <SelectChips opciones={SEXOS} valor={sexo} onChange={setSexo} />

        <div className="flabel">Edad (aprox.)</div>
        <SelectChips opciones={EDADES} valor={edad} onChange={setEdad} otro placeholder="Ej: 2 años" />

        <div className="flabel">Collar / chapita</div>
        <SelectChips opciones={COLLAR} valor={collar} onChange={setCollar} otro placeholder="Detalle, ej: rojo con chapita" />

        <div className="flabel">Zona / barrio</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
            location_on
          </span>
          <select value={zona} onChange={(e) => cambiarZona(e.target.value)}>
            {NOMBRES_BARRIOS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="mappick" style={{ height: 190 }}>
          <MapaLeaflet
            center={[punto.lat, punto.lng]}
            zoom={15}
            interactivo
            onGps={setPunto}
            onMapaClick={setPunto}
            marcadores={[{ id: 'nuevo', lat: punto.lat, lng: punto.lng, tipo, especie }]}
          />
          <div className="hint">Tocá el mapa para marcar el lugar exacto</div>
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

        {tipo === 'perdido' && (
          <>
            <div className="flabel">Recompensa (opcional)</div>
            <div className="inp">
              <span className="mi" style={{ fontSize: 20, color: '#e0a300' }}>
                paid
              </span>
              <input value={recompensa} onChange={(e) => setRecompensa(e.target.value)} placeholder="Ej: $50.000" />
            </div>
            {recompensa.trim() && (
              <div className="aviso-estafa">
                ⚠️ Ojo: la recompensa puede atraer estafadores. Nunca pagues por adelantado ni des datos sensibles.
              </div>
            )}
          </>
        )}

        <div className="flabel">WhatsApp de contacto</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#25D366' }}>
            chat
          </span>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 343 412 3456" inputMode="tel" />
        </div>

        {ofrecerGuardar && (
          <button className="check-row" onClick={() => setGuardarMasc(!guardarMasc)}>
            <span className={'check-box' + (guardarMasc ? ' on' : '')}>
              {guardarMasc && (
                <span className="mi" style={{ fontSize: 16, color: '#fff' }}>
                  check
                </span>
              )}
            </span>
            <span>Guardar en <b>Mis mascotas</b> para la próxima</span>
          </button>
        )}

        <div style={{ height: 24 }} />
      </div>

      <div className="fsubmit">
        <button className="btn-pub" onClick={publicar} disabled={guardando}>
          <span className="mi" style={{ fontSize: 23 }}>
            {editando ? 'save' : 'campaign'}
          </span>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar reporte'}
        </button>
      </div>
    </div>
  )
}
