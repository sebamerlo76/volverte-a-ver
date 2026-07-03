import { useEffect, useRef, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { getNotifPrefs, guardarNotifPrefs } from '../data/store.js'
import { PARANA_CENTER } from '../lib/parana.js'

const DEFECTO = {
  avisar_match: true,
  avisar_avistamiento: true,
  avisar_cerca: false,
  centro_lat: null,
  centro_lng: null,
  radio_km: 5,
  especie: 'todas',
}

// Preferencias de notificación del usuario (qué avisos quiere recibir).
export default function NotifPrefs({ user }) {
  const [prefs, setPrefs] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    let vivo = true
    getNotifPrefs(user?.id)
      .then((p) => vivo && setPrefs(p ? { ...DEFECTO, ...p } : DEFECTO))
      .catch(() => vivo && setPrefs(DEFECTO))
    return () => {
      vivo = false
    }
  }, [user?.id])

  // Guarda con un pequeño retardo para no pegarle a la base en cada toque.
  function guardar(np) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      guardarNotifPrefs({
        user_id: user.id,
        avisar_match: np.avisar_match,
        avisar_avistamiento: np.avisar_avistamiento,
        avisar_cerca: np.avisar_cerca,
        centro_lat: np.centro_lat,
        centro_lng: np.centro_lng,
        radio_km: np.radio_km,
        especie: np.especie,
      }).catch((e) => console.warn('No se pudieron guardar las preferencias:', e))
    }, 600)
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

  if (!prefs) return null
  const centro = prefs.centro_lat != null ? [prefs.centro_lat, prefs.centro_lng] : PARANA_CENTER

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
          <div className="cerca-lbl">Tocá el mapa para marcar tu zona (centro del radio)</div>
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
    </div>
  )
}
