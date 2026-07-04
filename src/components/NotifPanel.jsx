import { tiempoRelativo } from '../lib/formato.js'

// Ícono según el tipo de notificación.
const ICONO = {
  match: 'pets',
  cerca: 'location_on',
  avistamiento: 'visibility',
  aparecio: 'celebration',
  novedad: 'edit',
}

export default function NotifPanel({ notifs, onClose, onAbrir, onMarcarTodas }) {
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
          {lista.length === 0 ? (
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
                <span className="notif-item-ico mi fill">{ICONO[n.tipo] || 'notifications'}</span>
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
