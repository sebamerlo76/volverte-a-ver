import { tiempoRelativo } from '../lib/formato.js'

// Ícono según el tipo de notificación. Están TODOS los tipos que mandan las Edge
// Functions: los que faltaban caían en la campana genérica, así que el resumen diario,
// los recordatorios y los pedidos de compartir se veían todos iguales.
const ICONO = {
  match: 'pets', // apareció una parecida por foto
  cerca: 'location_on', // nuevo aviso en tu zona
  avistamiento: 'visibility', // alguien la vio
  aparecio: 'celebration', // volvió a casa
  novedad: 'edit', // la familia actualizó su aviso
  compartir: 'share', // "ayudá a que vuelva a casa"
  recordatorio: 'help', // "¿cómo va la búsqueda?"
  preaviso: 'schedule', // el aviso está por pausarse
  pausado: 'pause_circle', // se pausó por inactividad
  resumen: 'bar_chart', // resumen diario (sólo admin)
}

// 'novedad' llega por dos caminos que no se parecen en nada y la Edge Function los manda
// con el mismo tipo: la familia actualizó SU aviso (trae reporteId), o se contó una
// novedad de la app desde el panel (sin reporteId, lleva a /novedades). Se distinguen por
// ahí, que además evita tener que tocar la función y redesplegarla. El auto_awesome es el
// mismo ícono que "Novedades" en el menú y el mismo ✨ del título del push.
function iconoDe(n) {
  if (n.tipo === 'novedad' && !n.reporteId) return 'auto_awesome'
  return ICONO[n.tipo] || 'notifications'
}

export default function NotifPanel({ notifs, onClose, onAbrir, onMarcarTodas, mostrarNudge, onPrimerosPasos }) {
  const lista = notifs || []
  const hayNoLeidas = lista.some((n) => !n.leida)

  return (
    <div className="notif-panel" onClick={onClose}>
      <div className="notif-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="notif-head">
          <div className="notif-head-t">Notificaciones</div>
          {hayNoLeidas ? (
            <button className="notif-marcar" onClick={onMarcarTodas}>
              Marcar leídas
            </button>
          ) : null}
          <button className="mi notif-cerrar" onClick={onClose} aria-label="Cerrar">
            close
          </button>
        </div>

        <div className="notif-lista">
          {mostrarNudge && (
            <button className="notif-nudge" onClick={onPrimerosPasos}>
              <span className="notif-nudge-ico mi fill">flag</span>
              <div className="notif-item-txt">
                <div className="notif-item-t">Completá tus primeros pasos 🐾</div>
                <div className="notif-item-c">Ubicación, mascotas, notificaciones y más</div>
              </div>
              <span className="mi notif-nudge-arrow">chevron_right</span>
            </button>
          )}

          {lista.length === 0 && !mostrarNudge ? (
            <div className="notif-vacio">
              <span className="mi" style={{ fontSize: 42, color: '#cabeb5' }}>
                notifications_none
              </span>
              <div>
                Todavía no tenés novedades.
                <br />
                Acá te aviso cuando pase algo con tus avisos o los que seguís. 🐾
              </div>
            </div>
          ) : (
            lista.map((n) => (
              <button
                key={n.id}
                className={'notif-item' + (n.leida ? '' : ' no-leida')}
                onClick={() => onAbrir(n)}
              >
                <span className="notif-item-ico mi fill">{iconoDe(n)}</span>
                <div className="notif-item-txt">
                  <div className="notif-item-t">{n.titulo}</div>
                  {n.cuerpo ? <div className="notif-item-c">{n.cuerpo}</div> : null}
                  <div className="notif-item-time">{tiempoRelativo(n.creadoEn)}</div>
                </div>
                {!n.leida ? <span className="notif-dot" /> : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
