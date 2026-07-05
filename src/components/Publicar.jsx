import { useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { coordsDeBarrio, puntoDeReporte } from '../lib/parana.js'
import { NOMBRES_LOCALIDADES, LOCALIDAD_DEFECTO, nombresBarriosDe, coordsDeBarrioEn } from '../lib/localidades.js'
import { addReporte, actualizarReporte, addMascota, subirFotos, guardarEmbedding } from '../data/store.js'
import SelectChips from './SelectChips.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import FechaPicker from './FechaPicker.jsx'
import { COLORES, SEXOS, EDADES, COLLAR, TAMANOS, RAZAS_PERRO, RAZAS_GATO } from '../lib/opciones.js'
import { tieneGroseria } from '../lib/moderacion.js'

export default function Publicar({ inicial, plantilla, ofrecerGuardar, telefonoGuardado = '', onCerrar, onPublicado, onToast }) {
  const editando = !!inicial
  // base = datos para prellenar: un aviso a editar, o una mascota guardada ("Se me perdió").
  const base = inicial || plantilla || null
  const [tipo, setTipo] = useState(base?.tipo || 'perdido')
  const [especie, setEspecie] = useState(base?.especie || 'perro')
  const [fotos, setFotos] = useState(
    base?.fotos?.length
      ? base.fotos.map((u) => ({ url: u, file: null }))
      : base?.foto
      ? [{ url: base.foto, file: null }]
      : []
  )
  const [nombre, setNombre] = useState(base?.nombre || '')
  const [color, setColor] = useState(base?.color || '')
  const [raza, setRaza] = useState(base?.raza || '')
  const [tamano, setTamano] = useState(base?.tamano || '')
  const [sexo, setSexo] = useState(base?.sexo || '')
  const [edad, setEdad] = useState(base?.edad || '')
  const [collar, setCollar] = useState(base?.collar || '')
  const [recompensa, setRecompensa] = useState(base?.recompensa || '')
  const [localidad, setLocalidad] = useState(base?.localidad || LOCALIDAD_DEFECTO)
  const [zona, setZona] = useState(base?.zona || 'Centro')
  const [fecha, setFecha] = useState(base?.fechaEvento || '')
  const [descripcion, setDescripcion] = useState(base?.descripcion || '')
  const [whatsapp, setWhatsapp] = useState(base?.whatsapp || telefonoGuardado || '')
  const [guardarMasc, setGuardarMasc] = useState(true) // guardar en "Mis mascotas"
  const [enCustodia, setEnCustodia] = useState(base?.enCustodia || false) // la tengo conmigo (encontrado)
  const [guardando, setGuardando] = useState(false)

  const puntoIni =
    base?.lat != null && base?.lng != null
      ? [base.lat, base.lng]
      : coordsDeBarrioEn(base?.localidad || LOCALIDAD_DEFECTO, base?.zona || 'Centro')
  const [punto, setPunto] = useState({ lat: puntoIni[0], lng: puntoIni[1] })

  function cambiarZona(z) {
    setZona(z)
    const c = coordsDeBarrioEn(localidad, z)
    setPunto({ lat: c[0], lng: c[1] }) // al cambiar el barrio, el pin va a esa zona
  }
  function cambiarLocalidad(loc) {
    setLocalidad(loc)
    const z = nombresBarriosDe(loc)[0] || ''
    setZona(z)
    const c = coordsDeBarrioEn(loc, z)
    setPunto({ lat: c[0], lng: c[1] })
  }

  async function publicar() {
    if (tieneGroseria(`${nombre} ${descripcion} ${raza}`)) {
      onToast('Cuidá el lenguaje: sacá los insultos 🙏')
      return
    }
    if (!whatsapp.trim()) {
      onToast('Poné un WhatsApp de contacto 🙏')
      return
    }
    setGuardando(true)
    try {
      // Subimos las fotos nuevas y conservamos las que ya estaban.
      const fotosUrls = await subirFotos(fotos)
      const fotoUrl = fotosUrls[0] || ''
      // La huella visual NO se calcula acá (para que el guardado sea instantáneo):
      // se hace en segundo plano después de publicar (ver más abajo).
      const embedding = base?.embedding ?? null
      const datos = {
        tipo,
        especie,
        nombre: nombre.trim() || null,
        localidad,
        zona,
        referencia: zona,
        color,
        tamano,
        raza: raza.trim(),
        sexo,
        edad: edad.trim(),
        collar: collar.trim(),
        recompensa: tipo === 'perdido' ? recompensa.trim() : '',
        descripcion: descripcion.trim(),
        foto: fotoUrl,
        fotos: fotosUrls,
        whatsapp: whatsapp.trim(),
        fechaEvento: fecha || new Date().toISOString().slice(0, 10),
        mascotaId: base?.mascotaId ?? null,
        lat: punto.lat,
        lng: punto.lng,
        enCustodia: tipo === 'encontrado' ? enCustodia : false,
        embedding,
      }
      const guardado = editando ? await actualizarReporte(inicial.id, datos) : await addReporte(datos)

      // Huella visual EN SEGUNDO PLANO (no bloquea el guardado). Usa la 1ª foto ya subida
      // (URL remota, sobrevive al cierre del formulario). Si falla, no pasa nada.
      const primeraUrl = fotosUrls[0]
      if (guardado?.id && primeraUrl && (fotos[0]?.file || !base?.embedding)) {
        import('../lib/similar.js')
          .then((m) => m.huellaDeImagen(primeraUrl))
          .then((emb) => emb && guardarEmbedding(guardado.id, emb))
          .catch(() => {})
      }

      // Si vino de "cargar y publicar", guardamos también la mascota en el perfil.
      if (ofrecerGuardar && guardarMasc) {
        try {
          await addMascota({
            nombre: nombre.trim() || null,
            especie,
            color: '',
            tamano: '',
            raza: raza.trim(),
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
            <span className="mi fill" style={{ fontSize: 19 }}>
              pets
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

        <div className="flabel">Fotos (hasta 3)</div>
        <PhotoPicker value={fotos} onChange={setFotos} max={3} />

        <div className="flabel">Nombre (si lo sabés)</div>
        <div className="inp">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Rocco" />
        </div>

        <div className="flabel">Color</div>
        <SelectChips opciones={COLORES} valor={color} onChange={setColor} otro placeholder="Otro color" />

        <div className="flabel">Tamaño</div>
        <SelectChips opciones={TAMANOS} valor={tamano} onChange={setTamano} />

        {especie !== 'otro' && (
          <>
            <div className="flabel">Raza</div>
            <SelectChips
              opciones={especie === 'gato' ? RAZAS_GATO : RAZAS_PERRO}
              valor={raza}
              onChange={setRaza}
              otro
              placeholder="Otra raza"
            />
          </>
        )}

        <div className="flabel">Sexo</div>
        <SelectChips opciones={SEXOS} valor={sexo} onChange={setSexo} />

        <div className="flabel">Edad (aprox.)</div>
        <SelectChips opciones={EDADES} valor={edad} onChange={setEdad} otro placeholder="Ej: 2 años" />

        <div className="flabel">Collar / chapita</div>
        <SelectChips opciones={COLLAR} valor={collar} onChange={setCollar} otro placeholder="Detalle, ej: rojo con chapita" />

        {NOMBRES_LOCALIDADES.length > 1 && (
          <>
            <div className="flabel">Ciudad</div>
            <div className="inp">
              <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
                location_city
              </span>
              <select value={localidad} onChange={(e) => cambiarLocalidad(e.target.value)}>
                {NOMBRES_LOCALIDADES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="flabel">Zona / barrio</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
            location_on
          </span>
          <select value={zona} onChange={(e) => cambiarZona(e.target.value)}>
            {nombresBarriosDe(localidad).map((b) => (
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

        <div className="flabel">¿Cuándo fue?</div>
        <FechaPicker value={fecha} onChange={setFecha} />

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

        {tipo === 'encontrado' && (
          <button className="check-row" onClick={() => setEnCustodia((v) => !v)}>
            <span className={'check-box' + (enCustodia ? ' on' : '')}>
              {enCustodia && (
                <span className="mi" style={{ fontSize: 16, color: '#fff' }}>
                  check
                </span>
              )}
            </span>
            <span>
              La tengo conmigo <b>(en tránsito)</b>
            </span>
          </button>
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
