import { useEffect, useState } from 'react'
import PetCard from './PetCard.jsx'
import { getMisReportes, getMisMascotas } from '../data/store.js'

const ESPECIE_LBL = { perro: 'Perro', gato: 'Gato', otro: 'Otro' }

export default function MiCuenta({
  user,
  onVolver,
  onAbrir,
  onLogout,
  onNuevaMascota,
  onEditarMascota,
  onPublicarMascota,
}) {
  const [mios, setMios] = useState(null)
  const [mascotas, setMascotas] = useState(null)

  useEffect(() => {
    let vivo = true
    getMisReportes(user?.id)
      .then((r) => vivo && setMios(r))
      .catch(() => vivo && setMios([]))
    getMisMascotas(user?.id)
      .then((m) => vivo && setMascotas(m))
      .catch(() => vivo && setMascotas([]))
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
            <div className="perfil-sub">
              {activos} aviso{activos === 1 ? '' : 's'} activo{activos === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* ---- Mis mascotas ---- */}
        <div className="sec-head">
          <span>Mis mascotas</span>
          <button className="sec-add" onClick={onNuevaMascota}>
            <span className="mi" style={{ fontSize: 18 }}>
              add
            </span>
            Agregar
          </button>
        </div>

        {mascotas === null ? (
          <div className="empty" style={{ padding: '20px 30px' }}>
            Cargando…
          </div>
        ) : mascotas.length === 0 ? (
          <div className="masc-vacio">
            Cargá tu perro o gato acá 🐾 Si algún día se pierde, lo publicás al toque, sin llenar todo de nuevo.
          </div>
        ) : (
          mascotas.map((m) => (
            <div className="masc-row" key={m.id}>
              <button className="masc-info" onClick={() => onEditarMascota(m)}>
                <div className="masc-foto">
                  {m.foto ? (
                    <img src={m.foto} alt={m.nombre} onError={(e) => (e.target.style.display = 'none')} />
                  ) : (
                    <span className="mi fill" style={{ fontSize: 26, color: '#c9a58f' }}>
                      pets
                    </span>
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="masc-nombre">{m.nombre || 'Sin nombre'}</div>
                  <div className="masc-sub">
                    {ESPECIE_LBL[m.especie] || 'Mascota'}
                    {m.color ? ` · ${m.color}` : ''}
                  </div>
                </div>
              </button>
              <button className="masc-perdi" onClick={() => onPublicarMascota(m)}>
                Se me perdió
              </button>
            </div>
          ))
        )}

        {/* ---- Mis avisos ---- */}
        <div className="sec-head">
          <span>Mis avisos</span>
        </div>

        {mios === null ? (
          <div className="empty" style={{ padding: '20px 30px' }}>
            Cargando tus avisos…
          </div>
        ) : mios.length === 0 ? (
          <div className="empty" style={{ padding: '20px 30px' }}>
            Todavía no publicaste ningún aviso.
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
