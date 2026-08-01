import { useEffect, useState } from 'react'
import { esStandalone, esIOS } from '../lib/instalar.js'
import { soportado, estadoPermiso, yaSuscripto, activarPush } from '../lib/push.js'

// Banner "activá los avisos de tu zona": el push es el corazón de Chicho (avisar en
// la primera hora, que es cuando se encuentran), pero activarlo estaba escondido en
// Mi cuenta → poca gente lo tenía.
//
// Aparece con o SIN la app instalada. Antes exigía tenerla instalada, encadenando
// "primero instalá, después activá", y esa cadena se cortaba en el primer eslabón: de
// 177 visitas de campaña instalaron 5, así que a los otros 172 nunca se les ofreció lo
// único que hace a Chicho útil con el teléfono guardado. Web Push no necesita PWA: anda
// en Chrome/Android y en escritorio con el navegador solo. La excepción es iPhone, donde
// Apple sí exige "agregar a inicio" — ahí sigue yendo primero el banner de instalar.
// Los dos siguen siendo excluyentes: este tiene prioridad y avisa por onVisible.
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

// onVisible: le avisa al Feed si este banner va a aparecer, para que no muestre el de
// instalar al mismo tiempo. null mientras se decide (la decisión es asíncrona), así el
// otro no alcanza a aparecer y desaparecer.
export default function BannerNotifs({ logueado, onToast, onVisible = () => {} }) {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let vivo = true
    async function chequear() {
      const no = () => vivo && onVisible(false)
      if (!logueado) return no() // sin cuenta no hay a quién avisarle
      // En iPhone el push EXIGE la app agregada a inicio: sin eso el permiso no sirve de
      // nada y el botón sería mentira. En Android y escritorio no hace falta instalar —
      // Web Push anda en el navegador solo, y exigirlo nos costaba carísimo: de 177
      // visitas de campaña instalaban 5, así que a los otros 172 nunca les ofrecimos las
      // notificaciones, que es lo único que hace que Chicho sirva estando cerrado.
      if (esIOS() && !esStandalone()) return no()
      if (!soportado()) return no()
      if (estadoPermiso() === 'denied') return no() // no se puede volver a pedir
      const { n = 0, t = 0 } = leer()
      if (n >= MAX_DESCARTES) return no()
      if (t && Date.now() - t < DIAS * 86400000) return no()
      if (await yaSuscripto()) return no() // ya las tiene en este dispositivo
      if (vivo) {
        setVisible(true)
        onVisible(true)
      }
    }
    chequear()
    return () => {
      vivo = false
    }
  }, [logueado])

  if (!visible) return null

  // Al irse este banner, el de instalar queda libre para aparecer (son excluyentes).
  function ocultar() {
    setVisible(false)
    onVisible(false)
  }
  function cerrar() {
    guardar((leer().n || 0) + 1)
    ocultar()
  }
  async function activar() {
    if (busy) return
    setBusy(true)
    try {
      const ok = await activarPush()
      if (ok) {
        onToast?.('🔔 ¡Listo! Te avisamos de las mascotas de tu zona')
        ocultar()
      } else {
        // Tocó "Bloquear" en el cartel del navegador: no vuelve a preguntar → no insistimos.
        guardar(MAX_DESCARTES)
        ocultar()
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
