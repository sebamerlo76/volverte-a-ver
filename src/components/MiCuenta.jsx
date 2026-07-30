import { useCallback, useEffect, useState } from 'react'
import PetCard from './PetCard.jsx'
import { getMisReportes, getMisMascotas, getReportesPorIds, marcarResuelto, renovarReporte, reactivarReporte, desactivarCuenta, reactivarCuenta, subirFoto, guardarFotoReencuentro } from '../data/store.js'
import PhotoPicker from './PhotoPicker.jsx'
import { avatarDe, nombreUsuario } from '../lib/formato.js'
import { soportado as pushSoportado, yaSuscripto, activarPush, desactivarPush } from '../lib/push.js'
import { supabase, supabaseConfigurado } from '../lib/supabase.js'
import NotifPrefs from './NotifPrefs.jsx'
import MisUbicaciones from './MisUbicaciones.jsx'
import PrimerosPasos from './PrimerosPasos.jsx'
import { confirmar } from '../lib/confirmar.js'
import { pasoHecho, marcarPaso } from '../lib/pasos.js'
import { fotoOptimizada } from '../lib/foto.js'

const ESPECIE_LBL = { perro: 'Perro', gato: 'Gato', otro: 'Otro' }
// A partir de acá ofrecemos renovar. Tiene que coincidir con el primer recordatorio
// que manda el cron a los 3 días ("renovalo"): si no, le pedíamos renovar por push y
// al entrar no estaba el botón.
const DIAS_VIEJO = 3
function diasDe(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  return isNaN(ms) ? 0 : Math.floor(ms / 86400000)
}
const TITULOS = {
  animalitos: 'Mis mascotas',
  ubicaciones: 'Mis ubicaciones',
  notificaciones: 'Notificaciones',
  avisos: 'Avisos',
  cuenta: 'Mi cuenta',
  'primeros-pasos': 'Primeros pasos',
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
  onIrSeccion,
  onCompletoPasos,
  onResuelto,
  onToast,
  seguidos = [],
  onDejarDeSeguir,
}) {
  const [mios, setMios] = useState(null)
  const [mascotas, setMascotas] = useState(null)
  const [tabAviso, setTabAviso] = useState('mios')
  const [segReportes, setSegReportes] = useState(null)
  const [pushOk, setPushOk] = useState(false)
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [prefsAbierto, setPrefsAbierto] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(user?.user_metadata?.nombre || '')
  const [telEdit, setTelEdit] = useState(user?.user_metadata?.telefono || '')
  const [guardando, setGuardando] = useState(false)
  const [renovando, setRenovando] = useState(null)

  async function renovar(id) {
    setRenovando(id)
    try {
      await renovarReporte(id)
      onToast?.('🔄 ¡Aviso renovado! Vuelve arriba en el feed')
      await cargar()
    } catch (e) {
      console.error(e)
      onToast?.('No se renovó. Probá de nuevo 🔄')
    } finally {
      setRenovando(null)
    }
  }
  // "No tengo mascotas por ahora": tilda el paso de mascotas para el vecino que solo
  // quiere ayudar (si no, el aviso de primeros pasos no se apaga nunca).
  const [, setRefrescar] = useState(0)
  function marcarSinMascotas() {
    marcarPaso('sinMascotas')
    setRefrescar((n) => n + 1) // el flag vive en localStorage: forzamos el repintado
    onToast?.('👍 Listo. Si algún día tenés una, la cargás desde acá')
  }

  // Foto del reencuentro a posteriori: muchos la suben días después del festejo.
  // Apenas la eligen (ya recortada), se sube sin más pasos.
  const [fotoReencId, setFotoReencId] = useState(null) // aviso con el selector abierto
  const [fotoReencBusy, setFotoReencBusy] = useState(false)
  async function subirFotoReenc(r, arr) {
    const it = arr[0]
    if (!it || fotoReencBusy) return
    setFotoReencBusy(true)
    try {
      const url = await subirFoto(it.thumb)
      await guardarFotoReencuentro(r.id, url)
      onToast?.('📸 ¡Foto del reencuentro subida! Ya está en Ya en casa 💛')
      setFotoReencId(null)
      await cargar()
    } catch (e) {
      console.error(e)
      onToast?.('No se pudo subir la foto. Probá de nuevo 🔄')
    } finally {
      setFotoReencBusy(false)
    }
  }

  // Sacar un aviso de pausa: vuelve al feed, arriba y con el ciclo reiniciado.
  async function reactivarAviso(id) {
    setRenovando(id)
    try {
      await reactivarReporte(id)
      onToast?.('🟢 ¡Aviso reactivado! Vuelve al feed')
      await cargar()
    } catch (e) {
      console.error(e)
      onToast?.('No se reactivó. Probá de nuevo 🔄')
    } finally {
      setRenovando(null)
    }
  }

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

  // Los avisos que sigo: guardamos sólo los ids (prop seguidos), así que traemos
  // sus datos. Refresca cuando cambia el conjunto (p. ej. al dejar de seguir).
  const idsSeguidos = (seguidos || []).join(',')
  useEffect(() => {
    let vivo = true
    getReportesPorIds(seguidos || [])
      .then((rs) => vivo && setSegReportes(rs))
      .catch(() => vivo && setSegReportes([]))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsSeguidos])

  function dejarDeSeguir(id) {
    setSegReportes((rs) => (rs || []).filter((r) => r.id !== id)) // saca ya (optimista)
    onDejarDeSeguir?.(id)
  }

  // Aviso activo vinculado a una mascota = está publicada como perdida.
  function avisoActivoDe(m) {
    return (mios || []).find((r) => r.mascotaId === m.id && r.estado === 'activo') || null
  }
  // Recibe el aviso entero: App lo necesita para armar el festejo (la pantalla que
  // ofrece compartir el reencuentro). Antes acá se marcaba resuelto a mano y sólo
  // salía un toast, así que cerrando desde Mi cuenta se perdía ese momento.
  async function aparecio(rep) {
    try {
      if (onResuelto) await onResuelto(rep) // marca resuelto + festejo (App)
      else await marcarResuelto(rep.id) // sin el prop: al menos que cierre
      await cargar() // refrescar mi lista
    } catch (e) {
      console.error(e)
      onToast?.('No se actualizó. Probá de nuevo 🔄')
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
      onToast?.(e.message || 'No salió. Probá de nuevo 🔄')
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
      onToast?.('No se guardaron. Probá de nuevo 🔄')
    } finally {
      setGuardando(false)
    }
  }

  // Solo demo: borra todo lo local (avisos, mascotas, ubicaciones, marcas) y recarga.
  // Vuelve al feed de ejemplo, listo para grabar de nuevo. No existe en la app real.
  async function reiniciarDemo() {
    if (supabaseConfigurado) return // jamás en la app real: localStorage.clear() borraría la sesión
    if (!(await confirmar({ mensaje: '¿Reiniciar la demo? Se borra lo que cargaste y vuelve al feed de ejemplo.', aceptar: 'Reiniciar', peligro: true }))) return
    try {
      localStorage.clear()
    } catch (e) {
      /* ignore */
    }
    location.reload()
  }

  const desactivada = !!user?.user_metadata?.desactivada
  async function desactivar() {
    if (!(await confirmar({ mensaje: '¿Desactivar tu cuenta? Tus avisos dejan de verse y no vas a recibir notificaciones. Podés reactivarla cuando quieras.', aceptar: 'Desactivar', peligro: true }))) return
    try {
      await desactivarCuenta(user.id)
      await desactivarPush().catch(() => {})
      setPushOn(false)
      onToast?.('Tu cuenta quedó desactivada. Reactivala cuando quieras 🐾')
    } catch (e) {
      console.error(e)
      onToast?.('No salió. Probá de nuevo 🔄')
    }
  }
  async function reactivar() {
    try {
      await reactivarCuenta(user.id)
      onToast?.('🎉 ¡Cuenta reactivada! Tus avisos vuelven a verse.')
    } catch (e) {
      console.error(e)
      onToast?.('No salió. Probá de nuevo 🔄')
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
        {/* ---------------- Primeros pasos ---------------- */}
        {seccion === 'primeros-pasos' && (
          <PrimerosPasos
            user={user}
            onIrSeccion={onIrSeccion}
            onNuevaMascota={onNuevaMascota}
            onCompleto={onCompletoPasos}
            onToast={onToast}
          />
        )}

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

            {/* Solo en el Chicho demo (sin Supabase): reiniciar borra lo local y vuelve
                al feed de ejemplo. Para arrancar cada grabación desde cero. */}
            {!supabaseConfigurado && (
              <div style={{ padding: '24px 20px 8px' }}>
                <button className="btn-logout" onClick={reiniciarDemo}>
                  <span className="mi" style={{ fontSize: 21 }}>
                    refresh
                  </span>
                  Reiniciar demo
                </button>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
                  Borra lo que cargaste y vuelve al ejemplo.
                </div>
              </div>
            )}
            {supabaseConfigurado && (
              <div style={{ padding: '24px 20px 8px' }}>
                <button className="btn-logout" onClick={onLogout}>
                  <span className="mi" style={{ fontSize: 21 }}>
                    logout
                  </span>
                  Cerrar sesión
                </button>
              </div>
            )}
            <div style={{ padding: '0 20px 34px' }}>
              {desactivada ? (
                <div className="desact-box">
                  <div className="desact-txt">
                    Tu cuenta está <b>desactivada</b>. Tus avisos no se ven y no recibís notificaciones.
                  </div>
                  <button className="btn-reactivar" onClick={reactivar}>
                    <span className="mi" style={{ fontSize: 20 }}>
                      restart_alt
                    </span>
                    Reactivar mi cuenta
                  </button>
                </div>
              ) : (
                <button className="btn-desactivar" onClick={desactivar}>
                  Desactivar mi cuenta
                </button>
              )}
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

        {/* ---------------- Mis mascotas ---------------- */}
        {seccion === 'animalitos' && (
          <>
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
              <>
                <div className="masc-vacio">
                  Cargá tu perro o gato acá 🐾 Si algún día se pierde, lo publicás al toque, sin llenar todo de nuevo.
                </div>
                {/* El que solo quiere ayudar puede cerrar el tema acá: si no, le queda
                    el aviso de "primeros pasos" para siempre. */}
                {!pasoHecho('sinMascotas') && (
                  <button className="masc-notengo" onClick={marcarSinMascotas}>
                    No tengo mascotas por ahora
                  </button>
                )}
              </>
            ) : (
              (() => {
                const propias = mascotas.filter((m) => m.relacion !== 'transito')
                const transito = mascotas.filter((m) => m.relacion === 'transito')
                const hayMix = propias.length > 0 && transito.length > 0
                // Card cuadrada: la foto grande (se ve la carita) y, sobre todo, el
                // ESTADO separado de la ACCIÓN. Antes la fila mostraba un botón rojo
                // "Se me perdió" pegado al nombre y parecía que la mascota estaba
                // perdida — susto al pedo justo después de cargarla.
                const tarjeta = (m) => {
                  const aviso = avisoActivoDe(m)
                  const perdido = !!aviso
                  return (
                    <div className={'masc-card' + (perdido ? ' buscando' : '')} key={m.id}>
                      <button className="masc-card-foto" onClick={() => onEditarMascota(m)} aria-label={`Editar ${m.nombre || 'mascota'}`}>
                        {m.foto ? (
                          <img src={fotoOptimizada(m.foto, 400)} alt={m.nombre || ''} loading="lazy" onError={(e) => (e.target.style.display = 'none')} />
                        ) : (
                          <span className="mi fill" style={{ fontSize: 40, color: '#c9a58f' }}>pets</span>
                        )}
                        <span className={'masc-chip' + (perdido ? ' rojo' : '')}>
                          {perdido ? '🔴 Buscándolo' : '🏠 En casa'}
                        </span>
                      </button>
                      <div className="masc-card-body">
                        <button className="masc-card-nombre" onClick={() => onEditarMascota(m)}>
                          {m.nombre || 'Sin nombre'}
                        </button>
                        <div className="masc-sub">
                          {ESPECIE_LBL[m.especie] || 'Mascota'}
                          {m.color ? ` · ${m.color}` : ''}
                        </div>
                        {perdido ? (
                          <button className="masc-aparecio" onClick={() => aparecio(aviso)}>
                            <span className="mi" style={{ fontSize: 17 }}>celebration</span>
                            ¡Ya está en casa!
                          </button>
                        ) : (
                          <button className="masc-perdi" onClick={() => onPublicarMascota(m)}>
                            <span className="mi" style={{ fontSize: 17 }}>campaign</span>
                            Publicar que se perdió
                          </button>
                        )}
                      </div>
                    </div>
                  )
                }
                return (
                  <>
                    {hayMix && <div className="masc-grupo">Míos</div>}
                    <div className="masc-grid">{propias.map(tarjeta)}</div>
                    {transito.length > 0 && <div className="masc-grupo">En tránsito 🤝</div>}
                    {transito.length > 0 && <div className="masc-grid">{transito.map(tarjeta)}</div>}
                  </>
                )
              })()
            )}
          </>
        )}

        {/* ---------------- Avisos: Míos / Siguiendo ---------------- */}
        {seccion === 'avisos' && (
          <>
            <div className="av-tabs">
              <button className={'av-tab' + (tabAviso === 'mios' ? ' on' : '')} onClick={() => setTabAviso('mios')}>
                Míos
              </button>
              <button className={'av-tab' + (tabAviso === 'siguiendo' ? ' on' : '')} onClick={() => setTabAviso('siguiendo')}>
                Siguiendo
              </button>
            </div>
            {tabAviso === 'mios' ? (
              mios === null ? (
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
                  {/* Sin chip de estado acá: la tarjeta ya trae su badge (badgeEstado) y quedaban dos "Ya en casa" pisándose. */}
                  {conNovedad && (
                    <div className="novedad-chip">
                      <span className="mi fill" style={{ fontSize: 14 }}>
                        notifications_active
                      </span>
                      Novedad
                    </div>
                  )}
                  <div style={{ opacity: r.estado !== 'activo' ? 0.6 : 1 }}>
                    <PetCard r={r} onClick={() => onAbrir(r)} />
                  </div>
                  {r.estado === 'pausado' && (
                    <div className="renovar-bar">
                      <span>
                        En pausa por inactividad. Está guardado.
                      </span>
                      <div className="rb-acc">
                        <button className="rb-ok" onClick={() => reactivarAviso(r.id)} disabled={renovando === r.id}>
                          <span className="mi" style={{ fontSize: 15 }}>refresh</span>
                          {renovando === r.id ? '…' : 'Reactivar'}
                        </button>
                      </div>
                    </div>
                  )}
                  {r.estado === 'activo' && (
                    <div className="renovar-bar">
                      <span>
                        {diasDe(r.creadoEn) >= DIAS_VIEJO ? (
                          <>
                            Hace <b>{diasDe(r.creadoEn)} días</b>.
                          </>
                        ) : (
                          '¿Ya está en casa?'
                        )}
                      </span>
                      <div className="rb-acc">
                        {diasDe(r.creadoEn) >= DIAS_VIEJO && (
                          <button className="rb-sec" onClick={() => renovar(r.id)} disabled={renovando === r.id}>
                            <span className="mi" style={{ fontSize: 15 }}>refresh</span>
                            {renovando === r.id ? '…' : 'Renovar'}
                          </button>
                        )}
                        <button className="rb-ok" onClick={() => aparecio(r)}>
                          <span className="mi fill" style={{ fontSize: 15 }}>home</span>
                          Ya volvió
                        </button>
                      </div>
                    </div>
                  )}
                  {r.estado === 'resuelto' && !r.fotoReencuentro && (
                    <div className="renovar-bar">
                      <span>¿Tenés una foto del reencuentro? 📸</span>
                      <div className="rb-acc">
                        <button className="rb-ok" onClick={() => setFotoReencId(fotoReencId === r.id ? null : r.id)}>
                          <span className="mi" style={{ fontSize: 15 }}>add_a_photo</span>
                          {/* "Subir foto" y no "Compartir": en Chicho compartir ya significa
                              difundir el aviso afuera (WhatsApp/flyer) — se pisaría. */}
                          {fotoReencId === r.id ? 'Cancelar' : 'Subir foto'}
                        </button>
                      </div>
                    </div>
                  )}
                  {fotoReencId === r.id && (
                    <div style={{ margin: '0 16px 14px' }}>
                      <PhotoPicker value={[]} max={1} onChange={(arr) => subirFotoReenc(r, arr)} />
                      {fotoReencBusy && (
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginTop: 6 }}>Subiendo la foto…</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
            )
            ) : segReportes === null ? (
              <div className="empty" style={{ padding: '20px 30px' }}>
                Cargando…
              </div>
            ) : segReportes.length === 0 ? (
              <div className="empty" style={{ padding: '20px 30px' }}>
                Todavía no seguís ningún aviso. Abrí una mascota que te interese y tocá «Seguir esta búsqueda» para
                enterarte si aparece. 🔔
              </div>
            ) : (
              segReportes.map((r) => (
                <div key={r.id} style={{ position: 'relative' }}>
                  {/* La tarjeta ya trae su badge de estado (incluye "Ya en casa" y "En pausa"). */}
                  <div style={{ opacity: r.estado !== 'activo' ? 0.6 : 1 }}>
                    <PetCard r={r} onClick={() => onAbrir(r)} />
                  </div>
                  <div className="renovar-bar">
                    <span>Seguís este aviso</span>
                    <div className="rb-acc">
                      <button className="rb-sec" onClick={() => dejarDeSeguir(r.id)}>
                        <span className="mi" style={{ fontSize: 15 }}>
                          notifications_off
                        </span>
                        Dejar de seguir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ---------------- Mis ubicaciones ---------------- */}
        {seccion === 'ubicaciones' && <MisUbicaciones user={user} onToast={onToast} />}

        <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  )
}
