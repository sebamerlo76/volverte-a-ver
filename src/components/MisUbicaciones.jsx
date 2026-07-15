import { useEffect, useState } from 'react'
import SelectorCiudad from './SelectorCiudad.jsx'
import SelectorBarrio from './SelectorBarrio.jsx'
import { nombresBarriosDe, localidadGuardada, ubicacionTexto, NOMBRES_LOCALIDADES } from '../lib/localidades.js'
import { getUbicaciones, addUbicacion, actualizarUbicacion, eliminarUbicacion } from '../data/store.js'
import { confirmar } from '../lib/confirmar.js'

// Tus lugares (casa, trabajo). Son la única fuente de "dónde estás": de acá sale
// tu ciudad por defecto al publicar y a quién notificar.
//
// Antes esto era un punto en el mapa + un radio en km. Se sacó porque hacía lo
// mismo que el punto+radio de Notificaciones (los dos mandaban la notificación
// "cerca"), y porque el resto de la app habla en ciudades y barrios: un lat/lng
// suelto no se podía cruzar con nada.
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
    setLocalidad(localidadGuardada())
    setZona('')
    setAvisar(true)
    setModo('nuevo')
  }
  function editar(u) {
    setEditId(u.id)
    setNombre(u.nombre)
    setLocalidad(u.localidad || localidadGuardada())
    setZona(u.zona || '')
    setAvisar(u.avisar)
    setModo('nuevo')
  }

  // Cambiar de ciudad se lleva puesto el barrio: los de la anterior no existen acá.
  function cambiarCiudad(loc) {
    setLocalidad(loc)
    setZona('')
    setCiudadSheet(false)
  }
  function cambiarZonaSel(v) {
    setZona(v === 'Otro' ? '' : v)
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
        <SelectorBarrio opciones={nombresBarriosDe(localidad)} value={zona} onSelect={cambiarZonaSel} />

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
