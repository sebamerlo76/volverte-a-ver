import { useState } from 'react'
import MapaLeaflet from './MapaLazy.jsx'
import { coordsDeBarrio, puntoDeReporte } from '../lib/parana.js'
import { NOMBRES_LOCALIDADES, nombresBarriosDe, coordsDeBarrioEn, localidadGuardada, recordarLocalidad } from '../lib/localidades.js'
import SelectorCiudad from './SelectorCiudad.jsx'
import BuscarDireccion from './BuscarDireccion.jsx'
import { addReporte, actualizarReporte, addMascota, subirFotos, subirFotoFeed, guardarEmbedding } from '../data/store.js'
import SelectChips from './SelectChips.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import FechaPicker from './FechaPicker.jsx'
import SelectorBarrio from './SelectorBarrio.jsx'
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
  // Acordeón de características (mismo modo que "Encontré una"): una sección por vez,
  // al elegir salta sola a la siguiente. Arranca en Color.
  const [accAbierta, setAccAbierta] = useState('color')
  const [recompensa, setRecompensa] = useState(base?.recompensa || '')
  const [localidad, setLocalidad] = useState(base?.localidad || localidadGuardada())
  const [zona, setZona] = useState(base?.zona || 'Centro')
  const [fecha, setFecha] = useState(base?.fechaEvento || '')
  const [descripcion, setDescripcion] = useState(base?.descripcion || '')
  const [whatsapp, setWhatsapp] = useState(base?.whatsapp || telefonoGuardado || '')
  const [guardarMasc, setGuardarMasc] = useState(true) // guardar en "Mis mascotas"
  const [ciudadSheet, setCiudadSheet] = useState(false) // hoja para elegir ciudad
  const [enCustodia, setEnCustodia] = useState(base?.enCustodia || false) // la tengo conmigo (encontrado)
  const [guardando, setGuardando] = useState(false)

  const puntoIni =
    base?.lat != null && base?.lng != null
      ? [base.lat, base.lng]
      : coordsDeBarrioEn(base?.localidad || localidadGuardada(), base?.zona || 'Centro')
  const [punto, setPunto] = useState({ lat: puntoIni[0], lng: puntoIni[1] })

  function cambiarZona(z) {
    setZona(z)
    const c = coordsDeBarrioEn(localidad, z)
    setPunto({ lat: c[0], lng: c[1] }) // al cambiar el barrio, el pin va a esa zona
  }
  function cambiarLocalidad(loc) {
    setLocalidad(loc)
    recordarLocalidad(loc) // queda como tu ciudad por defecto para la próxima
    const z = 'Centro'
    setZona(z)
    const c = coordsDeBarrioEn(loc, z)
    setPunto({ lat: c[0], lng: c[1] })
  }
  function cambiarZonaSel(v) {
    if (v === 'Otro') setZona('') // barrio libre: lo escriben y ubican con el buscador/mapa
    else cambiarZona(v)
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
      const fotosUrls = await subirFotos(fotos) // completas (para el detalle)
      const fotoUrl = await subirFotoFeed(fotos, fotosUrls[0] || '') // recorte para el feed
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
      onToast('No se guardó. Revisá la conexión y reintentá 🔄')
      setGuardando(false)
    }
  }

  // Acordeón de características (Color → Collar). Raza no va si es "otro" animal.
  const SECS = [
    { k: 'color', t: 'Color', v: color },
    { k: 'tamano', t: 'Tamaño', v: tamano },
    ...(especie !== 'otro' ? [{ k: 'raza', t: 'Raza', v: raza }] : []),
    { k: 'sexo', t: 'Sexo', v: sexo },
    { k: 'edad', t: 'Edad (aprox.)', v: edad },
    { k: 'collar', t: 'Collar / chapita', v: collar },
  ]
  function saltarA(k) {
    const i = SECS.findIndex((s) => s.k === k)
    setAccAbierta(SECS[i + 1]?.k || null) // la última cierra todo
  }
  function cuerpoSec(k) {
    if (k === 'color')
      return <SelectChips opciones={COLORES} valor={color} onChange={setColor} onElegir={() => saltarA('color')} otro placeholder="Otro color" />
    if (k === 'tamano') return <SelectChips opciones={TAMANOS} valor={tamano} onChange={setTamano} onElegir={() => saltarA('tamano')} />
    if (k === 'raza')
      return (
        <SelectChips
          opciones={especie === 'gato' ? RAZAS_GATO : RAZAS_PERRO}
          valor={raza}
          onChange={setRaza}
          onElegir={() => saltarA('raza')}
          otro
          placeholder="Otra raza"
        />
      )
    if (k === 'sexo') return <SelectChips opciones={SEXOS} valor={sexo} onChange={setSexo} onElegir={() => saltarA('sexo')} />
    if (k === 'edad')
      return <SelectChips opciones={EDADES} valor={edad} onChange={setEdad} onElegir={() => saltarA('edad')} otro placeholder="Ej: 2 años" />
    return <SelectChips opciones={COLLAR} valor={collar} onChange={setCollar} onElegir={() => saltarA('collar')} otro placeholder="Detalle, ej: rojo con chapita" />
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

        <div className="flabel">Características</div>
        <div className="acc-lista">
          {SECS.map((s) => (
            <div className="acc" key={s.k}>
              <button
                type="button"
                className={'acc-h' + (accAbierta === s.k ? ' on' : '')}
                onClick={() => setAccAbierta(accAbierta === s.k ? null : s.k)}
              >
                <span className="acc-t">{s.t}</span>
                <span className={'acc-v' + (s.v ? '' : ' vacio')}>{s.v || 'Elegir'}</span>
                <span className="mi acc-ch">{accAbierta === s.k ? 'expand_less' : 'expand_more'}</span>
              </button>
              {accAbierta === s.k && <div className="acc-b">{cuerpoSec(s.k)}</div>}
            </div>
          ))}
        </div>

        {NOMBRES_LOCALIDADES.length > 1 && (
          <>
            <div className="flabel">Ciudad</div>
            <button type="button" className="inp inp-btn" onClick={() => setCiudadSheet(true)}>
              <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
                location_city
              </span>
              <span className="inp-btn-val">{localidad}</span>
              <span className="mi" style={{ fontSize: 22, color: 'var(--muted)' }}>
                expand_more
              </span>
            </button>
          </>
        )}

        <div className="flabel">Zona / barrio</div>
        <SelectorBarrio opciones={nombresBarriosDe(localidad)} value={zona} onSelect={cambiarZonaSel} />
        {!nombresBarriosDe(localidad).includes(zona) && (
          <div className="inp" style={{ marginTop: 8 }}>
            <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
              edit
            </span>
            <input value={zona} onChange={(e) => setZona(e.target.value)} placeholder="¿Qué barrio? (ej: Paracao)" />
          </div>
        )}
        <BuscarDireccion localidad={localidad} onEncontrado={setPunto} onToast={onToast} />
        <div className="mappick" style={{ height: 190 }}>
          <MapaLeaflet
            center={[punto.lat, punto.lng]}
            zoom={15}
            interactivo
            onGps={setPunto}
            onMapaClick={setPunto}
            marcadores={[{ id: 'nuevo', lat: punto.lat, lng: punto.lng, tipo, especie }]}
          />
          <div className="hint">Buscá la dirección o tocá el mapa para marcar el lugar exacto</div>
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

      {ciudadSheet && (
        <SelectorCiudad
          titulo="¿En qué ciudad?"
          ciudad={localidad}
          onCiudad={(l) => {
            cambiarLocalidad(l)
            setCiudadSheet(false)
          }}
          onCerrar={() => setCiudadSheet(false)}
        />
      )}
    </div>
  )
}
