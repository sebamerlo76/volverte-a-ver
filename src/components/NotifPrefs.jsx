import { useEffect, useRef, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
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
}

// Preferencias de notificación del usuario (qué avisos quiere recibir).
export default function NotifPrefs({ user, onToast, onListo }) {
  const [prefs, setPrefs] = useState(null)
  const [verMapa, setVerMapa] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    let vivo = true
    getNotifPrefs(user?.id)
      .then(
        (p) =>
          vivo &&
          setPrefs(
            p
              ? { ...DEFECTO, ...p, localidad: p.localidad || localidadGuardada() }
              : { ...DEFECTO, localidad: localidadGuardada() }
          )
      )
      .catch(() => vivo && setPrefs({ ...DEFECTO, localidad: localidadGuardada() }))
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
      localidad: np.localidad || localidadGuardada(),
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
  function cambiarLocalidad(l) {
    recordarLocalidad(l) // queda como tu ciudad por defecto para la próxima
    setPrefs((p) => {
      const np = { ...p, localidad: l, barrios: [] } // los barrios cambian según la ciudad
      guardar(np)
      return np
    })
  }

  if (!prefs) return null
  const loc = prefs.localidad || LOCALIDAD_DEFECTO
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
              <div className="cerca-lbl">¿En qué localidad?</div>
              <div className="barrio-chips" style={{ marginBottom: 12 }}>
                {NOMBRES_LOCALIDADES.map((l) => (
                  <button
                    key={l}
                    className={'esp-chip' + (loc === l ? ' on' : '')}
                    onClick={() => cambiarLocalidad(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="cerca-lbl">¿De qué barrios querés enterarte?</div>
          <div className="barrio-chips">
            <button className={'esp-chip' + (todos ? ' on' : '')} onClick={toggleTodos}>
              🌎 Todos
            </button>
            {nombresBarriosDe(loc).map((b) => {
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
          </div>

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
