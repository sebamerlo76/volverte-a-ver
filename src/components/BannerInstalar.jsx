import { useEffect, useState } from 'react'
import { hayPrompt, suscribir, instalar, esStandalone, esIOS } from '../lib/instalar.js'

// Banner "Sumate a la red de tu zona": aparece apenas se entra al feed e invita a
// instalar la app, con el gancho de las NOTIFICACIONES (ser parte de la red que
// avisa). Android: botón de un toque (cartel nativo). iPhone: instrucciones de
// Safari. Se oculta si ya está instalada o si el usuario lo descartó.
const CLAVE = 'chicho_banner_instalar' // 'no' = lo descartó

export default function BannerInstalar() {
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)
  const [instalable, setInstalable] = useState(false)

  useEffect(() => {
    if (esStandalone()) return // ya la tiene instalada (PWA o app de Play)
    try {
      if (localStorage.getItem(CLAVE) === 'no') return
    } catch (e) {
      /* ignore */
    }
    setIos(esIOS())
    setInstalable(hayPrompt())
    setVisible(true)
    return suscribir(() => setInstalable(hayPrompt()))
  }, [])

  // En Android sin prompt todavía no mostramos (evita un botón muerto). iOS siempre.
  if (!visible || (!ios && !instalable)) return null

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, 'no')
    } catch (e) {
      /* ignore */
    }
    setVisible(false)
  }
  async function alInstalar() {
    const r = await instalar()
    if (r === 'accepted') setVisible(false)
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
        <div className="inst-t">Sumate a la red de tu zona</div>
        <div className="inst-d">
          Instalá Chicho y recibí un aviso al toque cuando se pierde o aparece una mascota cerca tuyo.
        </div>
        {ios ? (
          <div className="inst-ios">
            En iPhone: tocá <b>Compartir&nbsp;↑</b> abajo y elegí <b>«Agregar a inicio»</b>. Sin instalar no
            llegan los avisos — es el único modo de que Chicho te notifique. 🔔
          </div>
        ) : (
          <button className="inst-btn" onClick={alInstalar}>
            <span className="mi fill" style={{ fontSize: 19 }}>install_mobile</span>
            Instalar y recibir avisos
          </button>
        )}
      </div>
    </div>
  )
}
