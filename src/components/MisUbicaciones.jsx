import { useEffect, useState } from 'react'
import MapaLeaflet from './MapaLazy.jsx'
import SelectorCiudad from './SelectorCiudad.jsx'
import SelectorBarrio from './SelectorBarrio.jsx'
import BuscarDireccion from './BuscarDireccion.jsx'
import {
  nombresBarriosDe,
  coordsDeBarrioEn,
  centroDe,
  barrioMasCercano,
  barrioDeLaLista,
  localidadGuardada,
  ubicacionTexto,
  NOMBRES_LOCALIDADES,
} from '../lib/localidades.js'
import { getUbicaciones, addUbicacion, actualizarUbicacion, eliminarUbicacion } from '../data/store.js'
import { confirmar } from '../lib/confirmar.js'

// Tus lugares (casa, trabajo). Son la única fuente de "dónde estás": de acá sale
// tu ciudad por defecto al publicar y a quién notificar.
//
// Lo que se guarda es ciudad + barrio, nada más. El mapa y el buscador de dirección
// son sólo para ENCONTRAR el barrio y verlo: mucha gente sabe su calle y no el
// nombre de su barrio. La dirección no se guarda en ningún lado — el domicilio
// exacto de alguien no es un dato que esta app necesite tener.
//
// (Antes acá había un mapa con un radio en km. Eso sí se fue, y no vuelve: hacía lo
// mismo que el punto+radio de Notificaciones. Este mapa no define alcance, muestra.)
export default function MisUbicaciones({ user, onToast }) {
  const [lista, setLista] = useState(null)
  const [modo, setModo] = useState('lista') // lista | nuevo
  const [nombre, setNombre] = useState('')
  const [localidad, setLocalidad] = useState(localidadGuardada())
  const [zona, setZona] = useState('')
  const [avisar, setAvisar] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editId, setEditId] = useState(null)
  const [ciudadSheet, setCiudadSheet] = useState(false)
  const [mapaGrande, setMapaGrande] = useState(false) // 180px no alcanza para buscar una calle
  // Punto del mapa. NO se guarda: es sólo para encontrar el barrio y mirarlo.
  const [punto, setPunto] = useState(() => {
    const c = centroDe(localidadGuardada())
    return { lat: c[0], lng: c[1] }
  })

  async function cargar() {
    try {
      setLista(await getUbicaciones(user?.id))
    } catch (e) {
      setLista([])
    }
  }
  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  function nuevo() {
    setEditId(null)
    setNombre('')
    const loc = localidadGuardada()
    setLocalidad(loc)
    setZona('')
    const c = centroDe(loc)
    setPunto({ lat: c[0], lng: c[1] })
    setAvisar(true)
    setModo('nuevo')
  }
  function editar(u) {
    setEditId(u.id)
    setNombre(u.nombre)
    const loc = u.localidad || localidadGuardada()
    setLocalidad(loc)
    setZona(u.zona || '')
    // El mapa arranca en tu barrio, no en el centro de la ciudad: al editar querés
    // ver dónde quedó. (El punto no está guardado, sale del barrio.)
    const c = u.zona ? coordsDeBarrioEn(loc, u.zona) : centroDe(loc)
    setPunto({ lat: c[0], lng: c[1] })
    setAvisar(u.avisar)
    setModo('nuevo')
  }

  // Cambiar de ciudad se lleva puesto el barrio: los de la anterior no existen acá.
  function cambiarCiudad(loc) {
    setLocalidad(loc)
    setZona('')
    const c = centroDe(loc)
    setPunto({ lat: c[0], lng: c[1] })
    setCiudadSheet(false)
  }

  // --- Los dos sentidos entre el mapa y el barrio ---
  // Del mapa AL barrio: marcaste un punto (tocando o buscando la dirección) y te
  // proponemos el barrio. Es una propuesta: queda en el selector para que la mires.
  function irAlPunto(p, barrioDeOSM) {
    setPunto(p)
    // Primero lo que dice OSM (sale de sus polígonos, no de adivinar); si no lo
    // conocemos con ese nombre, el barrio nuestro más cercano al punto.
    const propuesto = barrioDeLaLista(localidad, barrioDeOSM) || barrioMasCercano(localidad, p.lat, p.lng)
    if (propuesto) setZona(propuesto)
  }
  // Del barrio AL mapa: tocaste un barrio y te lo mostramos, para confirmar que es
  // ese. Es la mitad que faltaba: el que sabe su barrio no tiene que buscar nada.
  function cambiarZona(z) {
    setZona(z)
    if (z) {
      const c = coordsDeBarrioEn(localidad, z)
      setPunto({ lat: c[0], lng: c[1] })
    }
  }

  async function guardar() {
    if (!nombre.trim()) {
      onToast?.('Ponele un nombre (ej. Casa 🏠)')
      return
    }
    setGuardando(true)
    try {
      const campos = { nombre: nombre.trim(), localidad, zona, avisar }
      if (editId) {
        await actualizarUbicacion(editId, campos)
        onToast?.('📍 Lugar actualizado')
      } else {
        await addUbicacion({ userId: user.id, ...campos })
        onToast?.('📍 Lugar guardado')
      }
      setModo('lista')
      setEditId(null)
      await cargar()
    } catch (e) {
      console.error(e)
      onToast?.('No se guardó. Probá de nuevo 🔄')
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(u) {
    if (!(await confirmar({ mensaje: `¿Borrar "${u.nombre}"?`, aceptar: 'Borrar', peligro: true }))) return
    setLista((l) => l.filter((x) => x.id !== u.id))
    eliminarUbicacion(u.id).catch(() => {})
  }
  function toggleAvisar(u) {
    const nv = !u.avisar
    setLista((l) => l.map((x) => (x.id === u.id ? { ...x, avisar: nv } : x)))
    actualizarUbicacion(u.id, { avisar: nv }).catch(() => {})
  }

  if (modo === 'nuevo') {
    return (
      <div style={{ padding: '4px 20px 20px' }}>
        <div className="flabel">Nombre del lugar</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
            home
          </span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Casa, Trabajo…" />
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

        <div className="flabel">Zona / barrio (opcional)</div>
        {/* El barrio acá no filtra nada: las notificaciones van por ciudad. Es para
            que reconozcas tus lugares de un vistazo. Por eso se puede dejar vacío. */}
        <SelectorBarrio
          opciones={nombresBarriosDe(localidad)}
          value={zona}
          onSelect={cambiarZona}
          vacio="Toda la ciudad (sin barrio)"
        />

        <div className="flabel">¿No sabés el barrio? Buscá tu calle</div>
        <BuscarDireccion localidad={localidad} onEncontrado={irAlPunto} onToast={onToast} />
        {/* Se agranda acá mismo, sin abrir otra pantalla: si fuera una vista aparte
            este componente se desmonta y perdés lo que venías cargando. Crece el
            contenedor nomás — el ResizeObserver de MapaLeaflet se encarga del resto. */}
        <div className="mappick" style={{ height: mapaGrande ? '62vh' : 180, marginTop: 8 }}>
          <MapaLeaflet
            center={[punto.lat, punto.lng]}
            zoom={mapaGrande ? 16 : 14}
            interactivo
            onGps={irAlPunto}
            onMapaClick={irAlPunto}
            marcadores={[{ id: 'u', lat: punto.lat, lng: punto.lng, tipo: 'avistamiento' }]}
          />
          <button
            type="button"
            className="map-expand"
            onClick={() => setMapaGrande((v) => !v)}
            aria-label={mapaGrande ? 'Achicar el mapa' : 'Agrandar el mapa'}
            aria-expanded={mapaGrande}
          >
            <span className="mi" style={{ fontSize: 20, color: '#2a2320' }}>
              {mapaGrande ? 'close_fullscreen' : 'open_in_full'}
            </span>
          </button>
          <div className="hint">Tocá el mapa y te decimos el barrio 👆</div>
        </div>
        <div className="ubic-nota">
          Tu dirección <b>no se guarda</b>: sirve para encontrar el barrio, nada más. 🔒
        </div>

        <button className="check-row" style={{ marginTop: 16 }} onClick={() => setAvisar((v) => !v)}>
          <span className={'check-box' + (avisar ? ' on' : '')}>
            {avisar && (
              <span className="mi" style={{ fontSize: 16, color: '#fff' }}>
                check
              </span>
            )}
          </span>
          <span>
            Avisarme de los avisos de <b>{localidad}</b> 🔔
          </span>
        </button>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="crop-cancelar" onClick={() => setModo('lista')}>
            Cancelar
          </button>
          <button className="crop-listo" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Guardar lugar'}
          </button>
        </div>

        {ciudadSheet && (
          <SelectorCiudad
            titulo="¿En qué ciudad?"
            ciudad={localidad}
            onCiudad={cambiarCiudad}
            onCerrar={() => setCiudadSheet(false)}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="sec-head">
        <span>Mis ubicaciones</span>
        <button className="sec-add" onClick={nuevo}>
          <span className="mi" style={{ fontSize: 18 }}>
            add
          </span>
          Agregar
        </button>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', padding: '0 20px 6px', lineHeight: 1.5 }}>
        Guardá tus lugares (casa, trabajo) y elegí de cuáles querés que te avise. El primero además es la ciudad que
        te proponemos al publicar. 🐾
      </div>

      {lista === null ? (
        <div className="empty" style={{ padding: '20px 30px' }}>
          Cargando…
        </div>
      ) : lista.length === 0 ? (
        <div className="empty" style={{ padding: '20px 30px' }}>
          Todavía no guardaste ningún lugar.
        </div>
      ) : (
        lista.map((u) => (
          <div className="ubic-row" key={u.id}>
            <button className="ubic-info" onClick={() => editar(u)}>
              <span className="mi fill ubic-ico" style={{ color: u.avisar ? 'var(--navy)' : '#c3b8b0' }}>
                location_on
              </span>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div className="ubic-nombre">{u.nombre}</div>
                <div className="ubic-sub">
                  {u.avisar ? '🔔 ' : '🔕 '}
                  {ubicacionTexto(u.localidad, u.zona)}
                </div>
              </div>
            </button>
            <button
              className={'switch' + (u.avisar ? ' on' : '')}
              onClick={() => toggleAvisar(u)}
              aria-label="Avisarme de los avisos de acá"
            >
              <span className="switch-k" />
            </button>
            <button className="ubic-x" onClick={() => borrar(u)} aria-label="Borrar lugar">
              <span className="mi" style={{ fontSize: 20, color: '#c3b8b0' }}>
                delete
              </span>
            </button>
          </div>
        ))
      )}
    </>
  )
}
