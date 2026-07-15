import { useEffect, useRef, useState } from 'react'
import { getNotifPrefs, guardarNotifPrefs, getUbicaciones } from '../data/store.js'
import { NOMBRES_LOCALIDADES, LOCALIDAD_DEFECTO, nombresBarriosDe, localidadGuardada, localidadesPorProvincia } from '../lib/localidades.js'

const DEFECTO = {
  avisar_match: true,
  avisar_avistamiento: true,
  avisar_cerca: false,
  especie: 'todas',
  barrios: [],
  localidad: 'Paraná',
  localidades: null, // una o varias ciudades para "cerca mío"
  provincias: [], // provincias enteras ("toda la provincia" — incluye ciudades futuras)
}

// Preferencias de notificación del usuario (qué avisos quiere recibir).
//
// Acá había además un "marcá un punto y radio exacto" con mapa. Se fue: hacía lo
// mismo que "Mis ubicaciones" (los dos mandaban la notificación "cerca" y se
// unían en la Edge Function), y era la peor versión — uno solo y sin nombre.
export default function NotifPrefs({ user, onToast, onListo }) {
  const [prefs, setPrefs] = useState(null)
  const [misLugares, setMisLugares] = useState([]) // para decir que ya están incluidos
  const [qBarrio, setQBarrio] = useState('') // búsqueda de barrio (ciudades grandes)
  const timer = useRef(null)

  // Tus lugares ya notifican por su cuenta. Los mostramos para que se entienda
  // por qué te llegan avisos de ahí sin haberlos tildado en esta pantalla.
  useEffect(() => {
    if (!user?.id) return
    getUbicaciones(user.id)
      .then((us) => setMisLugares(us.filter((u) => u.avisar && u.localidad)))
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    let vivo = true
    getNotifPrefs(user?.id)
      .then(
        (p) =>
          vivo &&
          setPrefs(
            p
              ? {
                  ...DEFECTO,
                  ...p,
                  localidades: p.localidades && p.localidades.length ? p.localidades : [p.localidad || localidadGuardada()],
                  provincias: Array.isArray(p.provincias) ? p.provincias : [],
                }
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
      especie: np.especie,
      barrios: np.barrios,
      localidades: np.localidades && np.localidades.length ? np.localidades : [np.localidad || localidadGuardada()],
      localidad: (np.localidades && np.localidades[0]) || np.localidad || localidadGuardada(), // compat
      provincias: np.provincias || [],
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
      const provs = p.provincias || []
      if (!next.length && !provs.length) next = [l] // no dejar todo vacío
      // Ojo: acá NO se toca tu ciudad. Guardaba next[0], o sea una cualquiera de
      // las que tildaste. Tu ciudad sale de "Mis ubicaciones" (ver App.jsx).
      // Barrios solo si es UNA sola ciudad y ninguna provincia entera.
      const barrios = next.length === 1 && !provs.length ? p.barrios : []
      const np = { ...p, localidades: next, localidad: next[0] || p.localidad, barrios }
      guardar(np)
      return np
    })
  }
  // "Toda la provincia": marca/desmarca la PROVINCIA entera (incluye ciudades
  // futuras). Al activarla, saca las ciudades sueltas de esa provincia (redundantes).
  function toggleProvincia(g) {
    setPrefs((p) => {
      const provs = p.provincias || []
      const on = provs.includes(g.provincia)
      const nextProvs = on ? provs.filter((x) => x !== g.provincia) : [...provs, g.provincia]
      let locs = p.localidades && p.localidades.length ? p.localidades : []
      if (!on) locs = locs.filter((c) => !g.ciudades.includes(c))
      if (!locs.length && !nextProvs.length) locs = [g.ciudades[0]] // no dejar todo vacío
      const barrios = locs.length === 1 && !nextProvs.length ? p.barrios : []
      const np = { ...p, provincias: nextProvs, localidades: locs, localidad: locs[0] || g.ciudades[0], barrios }
      guardar(np)
      return np
    })
  }

  if (!prefs) return null
  const locs = prefs.localidades && prefs.localidades.length ? prefs.localidades : [prefs.localidad || LOCALIDAD_DEFECTO]
  const provsSel = prefs.provincias || []
  // Barrios solo si hay UNA sola ciudad y ninguna provincia entera elegida.
  const unaSola = locs.length === 1 && provsSel.length === 0
  const loc = locs[0]
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
          {/* Tus lugares notifican solos. Sin decirlo, no se entiende por qué te
              llegan avisos de una ciudad que no tildaste acá. */}
          {misLugares.length > 0 && (
            <div className="cerca-lugares">
              <span className="mi fill" style={{ fontSize: 17, color: 'var(--navy)' }}>
                home
              </span>
              <div>
                Ya te avisamos de tus lugares:{' '}
                {misLugares.map((u, i) => (
                  <span key={u.id}>
                    {i > 0 && ', '}
                    <b>
                      {u.nombre} ({u.localidad})
                    </b>
                  </span>
                ))}
                . Acá sumás más.
              </div>
            </div>
          )}
          {NOMBRES_LOCALIDADES.length > 1 && (
            <>
              <div className="cerca-lbl">¿De qué zonas querés enterarte? (podés elegir varias)</div>
              {localidadesPorProvincia().map((g) => {
                const provEntera = provsSel.includes(g.provincia)
                return (
                  <div key={g.provincia} className="cerca-prov">
                    <div className="cerca-prov-h">
                      <span className="cerca-prov-n">{g.provincia}</span>
                      {g.ciudades.length > 1 && (
                        <div className="cerca-prov-toda">
                          <span>Toda la provincia</span>
                          <button
                            className={'switch sm' + (provEntera ? ' on' : '')}
                            onClick={() => toggleProvincia(g)}
                            role="switch"
                            aria-checked={provEntera}
                            aria-label={`Toda la provincia de ${g.provincia}`}
                          >
                            <span className="switch-k" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="barrio-chips">
                      {g.ciudades.map((l) => (
                        <button
                          key={l}
                          className={'esp-chip' + (provEntera || locs.includes(l) ? ' on' : '') + (provEntera ? ' dim' : '')}
                          onClick={() => !provEntera && toggleLocalidad(l)}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
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
              Te avisamos de <b>todos los avisos</b> de lo que marcaste
              {provsSel.length > 0 ? ' (las provincias enteras incluyen también las ciudades que sumemos más adelante)' : ''}. 🐾
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
