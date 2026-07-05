import { useEffect, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { PARANA_CENTER } from '../lib/parana.js'
import { getUbicaciones, addUbicacion, actualizarUbicacion, eliminarUbicacion } from '../data/store.js'

export default function MisUbicaciones({ user, onToast }) {
  const [lista, setLista] = useState(null)
  const [modo, setModo] = useState('lista') // lista | nuevo
  const [nombre, setNombre] = useState('')
  const [punto, setPunto] = useState({ lat: PARANA_CENTER[0], lng: PARANA_CENTER[1] })
  const [radio, setRadio] = useState(3)
  const [avisar, setAvisar] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editId, setEditId] = useState(null)

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
    setPunto({ lat: PARANA_CENTER[0], lng: PARANA_CENTER[1] })
    setRadio(3)
    setAvisar(true)
    setModo('nuevo')
  }
  function editar(u) {
    setEditId(u.id)
    setNombre(u.nombre)
    setPunto({ lat: u.lat, lng: u.lng })
    setRadio(u.radioKm || 3)
    setAvisar(u.avisar)
    setModo('nuevo')
  }

  async function guardar() {
    if (!nombre.trim()) {
      onToast?.('Ponele un nombre (ej. Casa 🏠)')
      return
    }
    setGuardando(true)
    try {
      if (editId) {
        await actualizarUbicacion(editId, { nombre: nombre.trim(), lat: punto.lat, lng: punto.lng, radioKm: radio, avisar })
        onToast?.('📍 Lugar actualizado')
      } else {
        await addUbicacion({ userId: user.id, nombre: nombre.trim(), lat: punto.lat, lng: punto.lng, radioKm: radio, avisar })
        onToast?.('📍 Lugar guardado')
      }
      setModo('lista')
      setEditId(null)
      await cargar()
    } catch (e) {
      console.error(e)
      onToast?.('No se pudo guardar 😕')
    } finally {
      setGuardando(false)
    }
  }

  function borrar(u) {
    if (!window.confirm(`¿Borrar "${u.nombre}"?`)) return
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

        <div className="flabel">Ubicación</div>
        <div className="mappick" style={{ height: 200 }}>
          <MapaLeaflet
            center={[punto.lat, punto.lng]}
            zoom={14}
            interactivo
            onGps={setPunto}
            onMapaClick={setPunto}
            marcadores={[{ id: 'u', lat: punto.lat, lng: punto.lng, tipo: 'avistamiento' }]}
          />
          <div className="hint">Tocá el mapa para marcar el lugar</div>
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
            Avisarme de avisos <b>cerca de acá</b> 🔔
          </span>
        </button>

        {avisar && (
          <>
            <div className="flabel" style={{ marginTop: 14 }}>
              Radio: {radio} km
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={radio}
              onChange={(e) => setRadio(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--navy)' }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="crop-cancelar" onClick={() => setModo('lista')}>
            Cancelar
          </button>
          <button className="crop-listo" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Guardar lugar'}
          </button>
        </div>
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
        Guardá tus lugares (casa, trabajo) y elegí de cuáles querés que te avise cuando aparezca un aviso cerca. 🐾
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
                <div className="ubic-sub">{u.avisar ? `🔔 Te aviso · ${u.radioKm} km` : '🔕 Sin avisos'}</div>
              </div>
            </button>
            <button
              className={'switch' + (u.avisar ? ' on' : '')}
              onClick={() => toggleAvisar(u)}
              aria-label="Avisarme de avisos acá"
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
