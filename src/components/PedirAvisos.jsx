import { useEffect, useState } from 'react'
import { hayPrompt, instalar } from '../lib/instalar.js'
import { activarPush } from '../lib/push.js'
import { marcarOfrecido, marcarBasta } from '../lib/avisos-push.js'
import { pixelEvento } from '../lib/pixel.js'

// Cartel que aparece justo después de SEGUIR un aviso: es el momento de máxima
// intención (la persona acaba de pedir que le avisen) y hasta ahora le dábamos una
// tarea — "activá la campana en Mi cuenta" — en vez de un botón.
//
// El `modo` ya viene decidido por lib/avisos-push.js (App lo calcula antes de abrir
// esta capa): 'activar' casi siempre —el push anda en el navegador, sin instalar nada—
// e 'instalar' sólo en iPhone sin agregar a inicio, donde Apple lo exige de verdad.
export default function PedirAvisos({ modo, onCerrar, onToast }) {
  const [busy, setBusy] = useState(false)
  const activarModo = modo === 'activar'

  // Este cartel y el banner del feed cuentan al mismo embudo (AvisosOfrecidos →
  // Activados/Rechazados): lo que se quiere saber es cuántos llegaron a ver el pedido,
  // no por cuál de los dos caminos. Si algún día importa distinguirlos, se separan ahí.
  useEffect(() => {
    if (activarModo) pixelEvento('AvisosOfrecidos')
  }, [activarModo])

  function cerrar() {
    marcarOfrecido()
    if (activarModo) pixelEvento('AvisosRechazados')
    onCerrar()
  }

  async function activar() {
    if (busy) return
    setBusy(true)
    try {
      const ok = await activarPush()
      if (ok) {
        pixelEvento('AvisosActivados')
        onToast?.('🔔 ¡Listo! Te avisamos de las novedades')
      } else {
        pixelEvento('AvisosRechazados')
      }
      marcarBasta() // activado, o bloqueado en el navegador: en los dos casos no se repregunta
      onCerrar()
    } catch (e) {
      console.error('activar push', e)
      onToast?.('No se pudieron activar. Probá desde Mi cuenta → Notificaciones 🔔')
      cerrar()
    } finally {
      setBusy(false)
    }
  }

  async function alInstalar() {
    const r = await instalar()
    if (r === 'accepted') onToast?.('📲 ¡Instalada! Abrila desde tu inicio y activá los avisos')
    cerrar()
  }

  return (
    <div className="festejo-ov" onClick={cerrar}>
      <div className="festejo-box" onClick={(e) => e.stopPropagation()}>
        <div className="festejo-emoji">🔔</div>
        <div className="festejo-t">{activarModo ? '¿Te avisamos al toque?' : 'Para que te lleguen los avisos'}</div>
        <div className="festejo-s">
          {activarModo
            ? 'Activá los avisos y te llega una notificación cuando haya novedades de esta búsqueda — aunque tengas Chicho cerrada.'
            : 'Instalá Chicho en tu inicio: es el único modo de que podamos avisarte cuando hay novedades. 📲'}
        </div>

        {activarModo ? (
          <button className="festejo-btn" onClick={activar} disabled={busy}>
            <span className="mi fill" style={{ fontSize: 22 }}>notifications</span>
            {busy ? 'Activando…' : 'Activar avisos'}
          </button>
        ) : hayPrompt() ? (
          <button className="festejo-btn" onClick={alInstalar}>
            <span className="mi fill" style={{ fontSize: 22 }}>install_mobile</span>
            Instalar Chicho
          </button>
        ) : (
          <div className="inst-ios" style={{ marginTop: 12 }}>
            En iPhone: tocá <b>Compartir&nbsp;↑</b> abajo y elegí <b>«Agregar a inicio»</b>. Después activá los avisos
            desde Mi cuenta. 🔔
          </div>
        )}

        <button className="festejo-cerrar" onClick={cerrar}>
          Ahora no
        </button>
      </div>
    </div>
  )
}
