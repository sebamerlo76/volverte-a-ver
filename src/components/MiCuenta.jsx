import { useEffect, useState } from 'react'
import PetCard from './PetCard.jsx'
import { getMisReportes } from '../data/store.js'

export default function MiCuenta({ user, onVolver, onAbrir, onLogout }) {
  const [mios, setMios] = useState(null) // null = cargando

  useEffect(() => {
    let vivo = true
    getMisReportes(user?.id)
      .then((r) => vivo && setMios(r))
      .catch(() => vivo && setMios([]))
    return () => {
      vivo = false
    }
  }, [user?.id])

  const email = user?.email || 'Tu cuenta'
  const activos = (mios || []).filter((r) => r.estado === 'activo').length

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onVolver}>
          arrow_back
        </button>
        <div className="ftitle">Mi cuenta</div>
      </div>

      <div className="body">
        <div className="perfil">
          <div className="perfil-av">
            <span className="mi fill" style={{ fontSize: 30 }}>
              account_circle
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="perfil-mail">{email}</div>
            <div className="perfil-sub">{activos} aviso{activos === 1 ? '' : 's'} activo{activos === 1 ? '' : 's'}</div>
          </div>
        </div>

        <div className="flabel" style={{ padding: '0 20px' }}>
          Mis avisos
        </div>

        {mios === null ? (
          <div className="empty">Cargando tus avisos…</div>
        ) : mios.length === 0 ? (
          <div className="empty">
            Todavía no publicaste ningún aviso.
            <br />
            Tocá la patita 🐾 para publicar el primero.
          </div>
        ) : (
          mios.map((r) => (
            <div key={r.id} style={{ position: 'relative' }}>
              {r.estado === 'resuelto' && <div className="resuelto-chip">🎉 Reencontrado</div>}
              <div style={{ opacity: r.estado === 'resuelto' ? 0.6 : 1 }}>
                <PetCard r={r} onClick={() => onAbrir(r)} />
              </div>
            </div>
          ))
        )}

        <div style={{ padding: '22px 20px 30px' }}>
          <button className="btn-logout" onClick={onLogout}>
            <span className="mi" style={{ fontSize: 21 }}>
              logout
            </span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
