import { avatarDe, nombreUsuario } from '../lib/formato.js'

// Menú desplegable desde la cara (arriba a la izquierda).
const ITEMS = [
  { k: 'animalitos', ic: 'pets', t: 'Mis animalitos' },
  { k: 'ubicaciones', ic: 'location_on', t: 'Mis ubicaciones' },
  { k: 'notificaciones', ic: 'notifications', t: 'Notificaciones' },
  { k: 'avisos', ic: 'campaign', t: 'Mis avisos' },
  { k: 'cuenta', ic: 'person', t: 'Mi cuenta' },
  { k: 'guia', ic: 'help', t: 'Guía' },
]

export default function MenuUsuario({ user, onSeccion, onLogout, onCerrar }) {
  const nombre = nombreUsuario(user)
  const email = user?.email || 'Tu cuenta'
  const avatar = avatarDe(user)

  return (
    <div className="menu-overlay" onClick={onCerrar}>
      <div className="menu-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="menu-perfil">
          <div className="menu-av">
            {avatar ? (
              <img src={avatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="mi fill" style={{ fontSize: 26 }}>
                account_circle
              </span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="menu-nombre">{nombre || 'Hola 🐾'}</div>
            <div className="menu-mail">{email}</div>
          </div>
        </div>

        <div className="menu-lista">
          {ITEMS.map((it) => (
            <button key={it.k} className="menu-item" onClick={() => onSeccion(it.k)}>
              <span className="mi menu-ico">{it.ic}</span>
              {it.t}
              <span className="mi menu-arrow">chevron_right</span>
            </button>
          ))}
        </div>

        <button className="menu-logout" onClick={onLogout}>
          <span className="mi menu-ico" style={{ color: '#c0554b' }}>
            logout
          </span>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
