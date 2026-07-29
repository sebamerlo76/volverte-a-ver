import { useEffect, useState } from 'react'
import { esStandalone } from '../lib/instalar.js'
import { soportado, estadoPermiso, yaSuscripto, activarPush } from '../lib/push.js'

// Banner "activá los avisos de tu zona": el push es el corazón de Chicho (avisar en
// la primera hora, que es cuando se encuentran), pero activarlo estaba escondido en
// Mi cuenta → poca gente lo tenía. Aparece SOLO con la app instalada (sin instalar
// va el otro banner, el de instalar: son mutuamente excluyentes).
//
// Insistencia: se cierra → vuelve a los 7 días; al 3er descarte no vuelve nunca.
// Si el navegador tiene el permiso DENEGADO no aparece: Chrome no lo vuelve a
// preguntar (hay que ir a ajustes del sistema), así que el botón sería un botón
// muerto — peor que no mostrar nada.
const CLAVE = 'chicho_banner_notifs' // { n: veces descartado, t: ms del último descarte }
const DIAS = 7
const MAX_DESCARTES = 3

function leer() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}
  } catch (e) {
    return {}
  }
}
function guardar(n) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ n, t: Date.now() }))
  } catch (e) {
    /* ignore */
  }
}

export default function BannerNotifs({ logueado, onToast }) {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let vivo = true
    async function chequear() {
      if (!logueado) return // sin cuenta no hay a quién avisarle
      if (!esStandalone()) return // solo con la app instalada
      if (!soportado()) return
      if (estadoPermiso() === 'denied') return // no se puede volver a pedir
      const { n = 0, t = 0 } = leer()
      if (n >= MAX_DESCARTES) return
      if (t && Date.now() - t < DIAS * 86400000) return
      if (await yaSuscripto()) return // ya las tiene en este dispositivo
      if (vivo) setVisible(true)
    }
    chequear()
    return () => {
      vivo = false
    }
  }, [logueado])

  if (!visible) return null

  function cerrar() {
    guardar((leer().n || 0) + 1)
    setVisible(false)
  }
  async function activar() {
    if (busy) return
    setBusy(true)
    try {
      const ok = await activarPush()
      if (ok) {
        onToast?.('🔔 ¡Listo! Te avisamos de las mascotas de tu zona')
        setVisible(false)
      } else {
        // Tocó "Bloquear" en el cartel del navegador: no vuelve a preguntar → no insistimos.
        guardar(MAX_DESCARTES)
        setVisible(false)
      }
    } catch (e) {
      console.error('activar push', e)
      onToast?.('No se pudieron activar. Probá desde Mi cuenta → Notificaciones 🔔')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inst-banner">
      <button className="inst-x" onClick={cerrar} aria-label="Cerrar">
        <span className="mi" style={{ fontSize: 20 }}>close</span>
      </button>
      <div className="inst-ico">
        <span className="mi fill" style={{ fontSize: 30 }}>notifications_active</span>
      </div>
      <div className="inst-body">
        <div className="inst-t">Activá los avisos de tu zona</div>
        <div className="inst-d">
          Te avisamos al toque cuando se pierde o aparece una mascota cerca tuyo — aunque tengas Chicho cerrada. Las
          primeras horas son las que más valen. 🔔
        </div>
        <button className="inst-btn" onClick={activar} disabled={busy}>
          <span className="mi fill" style={{ fontSize: 19 }}>notifications</span>
          {busy ? 'Activando…' : 'Activar avisos'}
        </button>
      </div>
    </div>
  )
}
