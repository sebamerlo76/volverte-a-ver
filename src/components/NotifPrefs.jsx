import { useEffect, useRef, useState } from 'react'
import MapaLeaflet from './MapaLazy.jsx'
import { getNotifPrefs, guardarNotifPrefs } from '../data/store.js'
import { NOMBRES_LOCALIDADES, LOCALIDAD_DEFECTO, nombresBarriosDe, centroDe, localidadGuardada, recordarLocalidad } from '../lib/localidades.js'

const DEFECTO = {
  avisar_match: true,
  avisar_avistamiento: true,
  avisar_cerca: false,
  centro_lat: null,
  centro_lng: null,
  radio_km: 5,
  especie: 'todas',
  barrios: [],
  localidad: 'Paraná',
  localidades: null, // una o varias ciudades para "cerca mío"
}

// Preferencias de notificación del usuario (qué avisos quiere recibir).
export default function NotifPrefs({ user, onToast, onListo }) {
  const [prefs, setPrefs] = useState(null)
  const [verMapa, setVerMapa] = useState(false)
  const [qBarrio, setQBarrio] = useState('') // búsqueda de barrio (ciudades grandes)
  const timer = useRef(null)

  useEffect(() => {
    let vivo = true
    getNotifPrefs(user?.id)
      .then(
        (p) =>
          vivo &&
          setPrefs(
            p
              ? { ...DEFECTO, ...p, localidades: p.localidades && p.localidades.length ? p.localidades : [p.localidad || localidadGuardada()] }
              : { ...DEFECTO, localidades: [localidadGuardada()] }
          )
      )
      .catch(() => vivo && setPrefs({ ...DEFECTO, localidades: [localidadGuardada()] }))
    return () => {
      vivo = false
    }
  }, [user?.id])

  function persistir(np) {
    return guardarNotifPrefs({
      user_id: user.id,
      avisar_match: np.avisar_match,
      avisar_avistamiento: np.avisar_avistamiento,
      avisar_cerca: np.avisar_cerca,
      centro_lat: np.centro_lat,
      centro_lng: np.centro_lng,
      radio_km: np.radio_km,
      especie: np.especie,
      barrios: np.barrios,
      localidades: np.localidades && np.localidades.length ? np.localidades : [np.localidad || localidadGuardada()],
      localidad: (np.localidades && np.localidades[0]) || np.localidad || localidadGuardada(), // compat
    })
  }
  // Autosave con un pequeño retardo, para no pegarle a la base en cada toque.
  function guardar(np) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      persistir(np).catch((e) => console.warn('No se pudieron guardar las preferencias:', e))
    }, 600)
  }
  // Guardado explícito (botón), con confirmación.
  async function guardarAhora() {
    if (timer.current) clearTimeout(timer.current)
    try {
      await persistir(prefs)
      onToast?.('✅ Preferencias guardadas')
      onListo?.()
    } catch (e) {
      console.warn(e)
      onToast?.('No se guardaron. Probá de nuevo 🔄')
    }
  }

  function set(campo, valor) {
    setPrefs((p) => {
      const np = { ...p, [campo]: valor }
      guardar(np)
      return np
    })
  }
  function setCentro(pt) {
    setPrefs((p) => {
      const np = { ...p, centro_lat: pt.lat, centro_lng: pt.lng }
      guardar(np)
      return np
    })
  }
  function toggleBarrio(b) {
    setPrefs((p) => {
      const cur = (p.barrios || []).filter((x) => x !== '*') // si estaba en "todos", salgo
      const barrios = cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]
      const np = { ...p, barrios }
      guardar(np)
      return np
    })
  }
  function toggleTodos() {
    setPrefs((p) => {
      const on = (p.barrios || []).includes('*')
      const np = { ...p, barrios: on ? [] : ['*'] }
      guardar(np)
      return np
    })
  }
  function toggleLocalidad(l) {
    setPrefs((p) => {
      const cur = p.localidades && p.localidades.length ? p.localidades : [p.localidad || LOCALIDAD_DEFECTO]
      let next = cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]
      if (!next.length) next = [l] // no dejar vacío
      recordarLocalidad(next[0])
      // Con más de una ciudad los barrios no aplican (avisamos de todos).
      const barrios = next.length === 1 ? p.barrios : []
      const np = { ...p, localidades: next, localidad: next[0], barrios }
      guardar(np)
      return np
    })
  }

  if (!prefs) return null
  const locs = prefs.localidades && prefs.localidades.length ? prefs.localidades : [prefs.localidad || LOCALIDAD_DEFECTO]
  const unaSola = locs.length === 1
  const loc = locs[0]
  const centro = prefs.centro_lat != null ? [prefs.centro_lat, prefs.centro_lng] : centroDe(loc)
  const todos = (prefs.barrios || []).includes('*')

  const Check = ({ campo, children }) => (
    <button className="check-row" onClick={() => set(campo, !prefs[campo])}>
      <span className={'check-box' + (prefs[campo] ? ' on' : '')}>
        {prefs[campo] && (
          <span className="mi" style={{ fontSize: 15, color: '#fff' }}>
            check
          </span>
        )}
      </span>
      <span>{children}</span>
    </button>
  )

  return (
    <div className="notif-prefs">
      <Check campo="avisar_match">
        Apareció una <b>parecida</b> a la mía 🐾
      </Check>
      <Check campo="avisar_avistamiento">
        Alguien <b>vio</b> a mi mascota 👀
      </Check>
      <Check campo="avisar_cerca">
        Nuevos avisos <b>cerca mío</b> 📍
      </Check>

      {prefs.avisar_cerca && (
        <div className="cerca-box">
          {NOMBRES_LOCALIDADES.length > 1 && (
            <>
              <div className="cerca-lbl">¿En qué localidades? (podés elegir varias)</div>
              <div className="barrio-chips" style={{ marginBottom: 12 }}>
                {NOMBRES_LOCALIDADES.map((l) => (
                  <button
                    key={l}
                    className={'esp-chip' + (locs.includes(l) ? ' on' : '')}
                    onClick={() => toggleLocalidad(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}
          {unaSola ? (
            <>
              <div className="cerca-lbl">¿De qué barrios querés enterarte?</div>
              {(() => {
                const barrios = nombresBarriosDe(loc)
                const grande = barrios.length > 30 // Córdoba (400+): buscador
                const q = qBarrio.trim().toLowerCase()
                const sel = (prefs.barrios || []).filter((b) => b !== '*')
                const mostrar = grande
                  ? Array.from(
                      new Set([...(todos ? [] : sel), ...(q ? barrios.filter((b) => b.toLowerCase().includes(q)) : [])])
                    ).slice(0, 60)
                  : barrios
                return (
                  <>
                    {grande && (
                      <input
                        className="fp-buscar"
                        value={qBarrio}
                        onChange={(e) => setQBarrio(e.target.value)}
                        placeholder="Buscá tu barrio…"
                      />
                    )}
                    <div className="barrio-chips">
                      <button className={'esp-chip' + (todos ? ' on' : '')} onClick={toggleTodos}>
                        🌎 Todos
                      </button>
                      {mostrar.map((b) => {
                        const on = !todos && (prefs.barrios || []).includes(b)
                        return (
                          <button
                            key={b}
                            className={'esp-chip' + (on ? ' on' : '') + (todos ? ' dim' : '')}
                            onClick={() => toggleBarrio(b)}
                          >
                            {b}
                          </button>
                        )
                      })}
                      {grande && q && mostrar.length === 0 && <span className="fp-vacio">Sin resultados</span>}
                    </div>
                  </>
                )
              })()}
            </>
          ) : (
            <div className="cerca-nota">
              Te avisamos de <b>todos los barrios</b> de las {locs.length} ciudades que elegiste 🐾
            </div>
          )}

          <button className="cerca-adv-toggle" onClick={() => setVerMapa((v) => !v)}>
            <span className="mi" style={{ fontSize: 18 }}>{verMapa ? 'expand_less' : 'expand_more'}</span>
            Marcar un punto y radio exacto (opcional)
          </button>
          {verMapa && (
            <div className="cerca-adv">
              <div className="cerca-lbl">Tocá el mapa para marcar tu punto (centro del radio)</div>
              <div className="mappick" style={{ height: 170 }}>
                <MapaLeaflet
                  center={centro}
                  zoom={13}
                  interactivo
                  onGps={setCentro}
                  onMapaClick={setCentro}
                  marcadores={[{ id: 'centro', lat: centro[0], lng: centro[1], tipo: 'encontrado' }]}
                />
              </div>
              <div className="cerca-radio">
                <span>Radio: <b>{prefs.radio_km} km</b></span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={prefs.radio_km}
                  onChange={(e) => set('radio_km', +e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="cerca-lbl" style={{ marginTop: 12 }}>¿Qué especie?</div>
          <div className="cerca-esp">
            {[
              { k: 'todas', t: 'Todas' },
              { k: 'perro', t: 'Perros' },
              { k: 'gato', t: 'Gatos' },
            ].map((o) => (
              <button
                key={o.k}
                className={'esp-chip' + (prefs.especie === o.k ? ' on' : '')}
                onClick={() => set('especie', o.k)}
              >
                {o.t}
              </button>
            ))}
          </div>
        </div>
      )}
      <button className="btn-guardar-prefs" onClick={guardarAhora}>
        <span className="mi" style={{ fontSize: 19 }}>
          check_circle
        </span>
        Guardar preferencias
      </button>
    </div>
  )
}
