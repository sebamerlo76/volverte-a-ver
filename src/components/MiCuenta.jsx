import { useCallback, useEffect, useState } from 'react'
import PetCard from './PetCard.jsx'
import { getMisReportes, getMisMascotas, marcarResuelto } from '../data/store.js'
import { avatarDe, nombreUsuario } from '../lib/formato.js'
import { soportado as pushSoportado, yaSuscripto, activarPush, desactivarPush } from '../lib/push.js'
import { supabase } from '../lib/supabase.js'
import NotifPrefs from './NotifPrefs.jsx'
import MisUbicaciones from './MisUbicaciones.jsx'

const ESPECIE_LBL = { perro: 'Perro', gato: 'Gato', otro: 'Otro' }
const TITULOS = {
  animalitos: 'Mis animalitos',
  ubicaciones: 'Mis ubicaciones',
  notificaciones: 'Notificaciones',
  avisos: 'Mis avisos',
  cuenta: 'Mi cuenta',
}

export default function MiCuenta({
  user,
  seccion = 'cuenta',
  notifs,
  onVolver,
  onAbrir,
  onLogout,
  onNuevaMascota,
  onEditarMascota,
  onPublicarMascota,
  onToast,
}) {
  const [mios, setMios] = useState(null)
  const [mascotas, setMascotas] = useState(null)
  const [pushOk, setPushOk] = useState(false)
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [prefsAbierto, setPrefsAbierto] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(user?.user_metadata?.nombre || '')
  const [telEdit, setTelEdit] = useState(user?.user_metadata?.telefono || '')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    const [r, m] = await Promise.all([
      getMisReportes(user?.id).catch(() => []),
      getMisMascotas(user?.id).catch(() => []),
    ])
    setMios(r)
    setMascotas(m)
  }, [user?.id])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Aviso activo vinculado a una mascota = está publicada como perdida.
  function avisoActivoDe(m) {
    return (mios || []).find((r) => r.mascotaId === m.id && r.estado === 'activo') || null
  }
  async function aparecio(avisoId) {
    try {
      await marcarResuelto(avisoId)
      await cargar()
      onToast?.('🎉 ¡Qué alegría! Tu mascota volvió a casa')
    } catch (e) {
      console.error(e)
      onToast?.('No se pudo actualizar 😕')
    }
  }

  useEffect(() => {
    setPushOk(pushSoportado())
    yaSuscripto()
      .then(setPushOn)
      .catch(() => {})
  }, [])

  async function togglePush() {
    if (pushBusy) return
    setPushBusy(true)
    try {
      if (pushOn) {
        await desactivarPush()
        setPushOn(false)
        onToast?.('Notificaciones desactivadas')
      } else {
        const ok = await activarPush()
        setPushOn(ok)
        onToast?.(ok ? '🔔 ¡Notificaciones activadas!' : 'Necesitás permitir las notificaciones')
      }
    } catch (e) {
      console.error(e)
      onToast?.(e.message || 'No se pudo cambiar 😕')
    } finally {
      setPushBusy(false)
    }
  }

  async function guardarPerfil() {
    setGuardando(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nombre: nombreEdit.trim(), telefono: telEdit.trim() },
      })
      if (error) throw error
      onToast?.('✅ Datos guardados')
    } catch (e) {
      console.error(e)
      onToast?.('No se pudieron guardar 😕')
    } finally {
      setGuardando(false)
    }
  }

  const email = user?.email || 'Tu cuenta'
  const nombre = nombreEdit || nombreUsuario(user)
  const avatar = avatarDe(user)
  const activos = (mios || []).filter((r) => r.estado === 'activo').length

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onVolver}>
          arrow_back
        </button>
        <div className="ftitle">{TITULOS[seccion] || 'Mi cuenta'}</div>
      </div>

      <div className="body">
        {/* ---------------- Mi cuenta ---------------- */}
        {seccion === 'cuenta' && (
          <>
            <div className="perfil">
              <div className="perfil-av">
                {avatar ? (
                  <img src={avatar} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span className="mi fill" style={{ fontSize: 30 }}>
                    account_circle
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="perfil-mail">{nombre || email}</div>
                <div className="perfil-sub">
                  {nombre ? email + ' · ' : ''}
                  {activos} activo{activos === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div className="sec-head">
              <span>Tus datos</span>
            </div>
            <div style={{ padding: '0 20px' }}>
              <div className="flabel">Tu nombre</div>
              <div className="inp">
                <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
                  person
                </span>
                <input value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} placeholder="Cómo te llamás" />
              </div>
              <div className="flabel">Tu teléfono (WhatsApp)</div>
              <div className="inp">
                <span className="mi" style={{ fontSize: 20, color: '#25D366' }}>
                  chat
                </span>
                <input
                  value={telEdit}
                  onChange={(e) => setTelEdit(e.target.value)}
                  placeholder="Ej: 343 412 3456"
                  inputMode="tel"
                />
              </div>
              <button className="btn-pub" style={{ marginTop: 16 }} onClick={guardarPerfil} disabled={guardando}>
                <span className="mi" style={{ fontSize: 21 }}>
                  save
                </span>
                {guardando ? 'Guardando…' : 'Guardar datos'}
              </button>
            </div>

            <div style={{ padding: '24px 20px 8px' }}>
              <button className="btn-logout" onClick={onLogout}>
                <span className="mi" style={{ fontSize: 21 }}>
                  logout
                </span>
                Cerrar sesión
              </button>
            </div>
            <div style={{ padding: '0 20px 34px', textAlign: 'center' }}>
              <button
                className="btn-desactivar"
                onClick={() => onToast?.('🔧 Muy pronto vas a poder desactivar tu cuenta')}
              >
                Desactivar mi cuenta
              </button>
            </div>
          </>
        )}

        {/* ---------------- Notificaciones ---------------- */}
        {seccion === 'notificaciones' &&
          (pushOk ? (
            <div className="notif-box">
              <div className="notif-row">
                <div style={{ minWidth: 0 }}>
                  <div className="notif-t">
                    <span className="mi" style={{ fontSize: 19, color: 'var(--navy)' }}>
                      notifications
                    </span>
                    Notificaciones
                  </div>
                  <div className="notif-sub">Te aviso cuando aparezca una parecida o la vean. 🐾</div>
                </div>
                <button
                  className={'switch' + (pushOn ? ' on' : '')}
                  onClick={togglePush}
                  disabled={pushBusy}
                  aria-label="Activar notificaciones"
                >
                  <span className="switch-k" />
                </button>
              </div>
              {pushOn && (
                <>
                  <button className="notif-ajustar" onClick={() => setPrefsAbierto((v) => !v)}>
                    <span className="mi" style={{ fontSize: 18 }}>
                      tune
                    </span>
                    Ajustar qué avisos recibir
                    <span className="mi" style={{ fontSize: 20, marginLeft: 'auto' }}>
                      {prefsAbierto ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {prefsAbierto && <NotifPrefs user={user} onToast={onToast} onListo={() => setPrefsAbierto(false)} />}
                </>
              )}
            </div>
          ) : (
            <div className="empty" style={{ padding: '30px' }}>
              Tu navegador no soporta notificaciones.
            </div>
          ))}

        {/* ---------------- Mis animalitos ---------------- */}
        {seccion === 'animalitos' && (
          <>
            <div className="sec-head">
              <span>Mis animalitos</span>
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
              mascotas.map((m) => {
                const aviso = avisoActivoDe(m)
                const perdido = !!aviso
                return (
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
                        <div className="masc-nombre">
                          {m.nombre || 'Sin nombre'}
                          {perdido && <span className="masc-estado">Perdido</span>}
                          {m.relacion === 'transito' && <span className="masc-transito">En tránsito</span>}
                        </div>
                        <div className="masc-sub">
                          {ESPECIE_LBL[m.especie] || 'Mascota'}
                          {m.color ? ` · ${m.color}` : ''}
                        </div>
                      </div>
                    </button>
                    {perdido ? (
                      <button className="masc-aparecio" onClick={() => aparecio(aviso.id)}>
                        <span className="mi" style={{ fontSize: 17 }}>
                          celebration
                        </span>
                        ¡Apareció!
                      </button>
                    ) : (
                      <button className="masc-perdi" onClick={() => onPublicarMascota(m)}>
                        Se me perdió
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </>
        )}

        {/* ---------------- Mis avisos ---------------- */}
        {seccion === 'avisos' &&
          (mios === null ? (
            <div className="empty" style={{ padding: '20px 30px' }}>
              Cargando tus avisos…
            </div>
          ) : mios.length === 0 ? (
            <div className="empty" style={{ padding: '20px 30px' }}>
              Todavía no publicaste ningún aviso.
            </div>
          ) : (
            mios.map((r) => {
              const conNovedad = (notifs || []).some((n) => !n.leida && n.reporteId === r.id)
              return (
                <div key={r.id} style={{ position: 'relative' }}>
                  {r.estado === 'resuelto' && <div className="resuelto-chip">🏠 En casa</div>}
                  {conNovedad && (
                    <div className="novedad-chip">
                      <span className="mi fill" style={{ fontSize: 14 }}>
                        notifications_active
                      </span>
                      Novedad
                    </div>
                  )}
                  <div style={{ opacity: r.estado === 'resuelto' ? 0.6 : 1 }}>
                    <PetCard r={r} onClick={() => onAbrir(r)} />
                  </div>
                </div>
              )
            })
          ))}

        {/* ---------------- Mis ubicaciones ---------------- */}
        {seccion === 'ubicaciones' && <MisUbicaciones user={user} onToast={onToast} />}

        <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  )
}
