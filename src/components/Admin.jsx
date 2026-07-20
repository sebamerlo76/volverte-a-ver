import { useEffect, useState } from 'react'
import { getAdminStats, getAdminStatsRango, getActividadReciente, getPerdidosParaEmpujar, getActivosPorProvincia, getReencuentros } from '../data/store.js'
import { tiempoRelativo, nombreMostrado, fechaLegible, linkWhatsAppReencuentro, linkTel } from '../lib/formato.js'
import { badgeEstado } from '../lib/estados.js'
import { ubicacionTexto } from '../lib/localidades.js'

function Card({ n, label, color }) {
  return (
    <div className="adm-card">
      <div className="adm-n" style={color ? { color } : undefined}>{n ?? '—'}</div>
      <div className="adm-l">{label}</div>
    </div>
  )
}

// Fila de un aviso en las listas del panel (actividad / empujón).
// pie (opcional): línea extra abajo — en el empujón dice si ya le avisamos al dueño.
function AvisoRow({ r, onOpen, pie }) {
  const b = badgeEstado(r)
  return (
    <button className="adm-row" onClick={() => onOpen && onOpen(r)}>
      <span className={'adm-row-badge ' + b.clase}>{b.t}</span>
      <div className="adm-row-txt">
        <div className="adm-row-t">{nombreMostrado(r)}</div>
        <div className="adm-row-s">{ubicacionTexto(r.localidad, r.zona)}</div>
        {pie && <div className="adm-row-pie">{pie}</div>}
      </div>
      <span className="adm-row-time">{tiempoRelativo(r.creadoEn)}</span>
    </button>
  )
}

// ¿Ya le avisamos al dueño y no hizo nada? Renovar bumpea creado_en, así que si el
// recordatorio es POSTERIOR a la creación, fue avisado y no renovó desde entonces.
function pieEmpujon(r) {
  if (r.recordatorioEn && r.recordatorioEn >= r.creadoEn) {
    return `🔔 Avisado ${tiempoRelativo(r.recordatorioEn)} · sin acción`
  }
  return '🔕 Todavía sin avisar'
}

export default function Admin({ onVolver, onOpen, stats }) {
  const [s, setS] = useState(stats || null)
  const [error, setError] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [rango, setRango] = useState(null)
  const [rangoBusy, setRangoBusy] = useState(false)
  const [recientes, setRecientes] = useState(null)
  const [empujar, setEmpujar] = useState(null)
  const [porProv, setPorProv] = useState(null)
  const [reencuentros, setReencuentros] = useState(null)

  useEffect(() => {
    getActividadReciente(15).then(setRecientes).catch(() => setRecientes([]))
    getPerdidosParaEmpujar(7, 20).then(setEmpujar).catch(() => setEmpujar([]))
    getActivosPorProvincia().then(setPorProv).catch(() => setPorProv([]))
    getReencuentros().then(setReencuentros).catch(() => setReencuentros([]))
  }, [])

  async function verRango() {
    if (!desde || !hasta) return
    setRangoBusy(true)
    try {
      setRango(await getAdminStatsRango(desde, hasta))
    } catch (e) {
      console.error(e)
    } finally {
      setRangoBusy(false)
    }
  }

  useEffect(() => {
    if (stats) return
    getAdminStats()
      .then(setS)
      .catch((e) => setError(e?.message || 'Error'))
  }, [stats])

  const maxMes = s ? Math.max(1, ...s.avisosPorMes.map((m) => m.total)) : 1
  const maxZona = s ? Math.max(1, ...s.topZonas.map((z) => z.total)) : 1
  const exito = s && s.avisos ? Math.round((s.enCasa / s.avisos) * 100) : 0

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onVolver}>
          arrow_back
        </button>
        <div className="ftitle">Panel · Chicho 📊</div>
      </div>

      <div className="body" style={{ padding: '6px 16px 34px' }}>
        {error ? (
          <div className="empty" style={{ padding: '30px' }}>
            No se pudieron cargar las estadísticas.
            <br />
            <span style={{ fontSize: 12, color: 'var(--faint)' }}>{error}</span>
          </div>
        ) : !s ? (
          <div className="empty" style={{ padding: '30px' }}>Cargando…</div>
        ) : (
          <>
            <div className="adm-grid">
              <Card n={s.usuarios} label="Usuarios" color="var(--navy)" />
              <Card n={s.avisos} label="Avisos totales" color="var(--navy)" />
              <Card n={s.activos} label="Activos" color="var(--teal)" />
              <Card n={s.enCasa} label="Ya en casa 🏠" color="var(--amber)" />
            </div>

            <div className="adm-exito">
              <div className="adm-exito-n">{exito}%</div>
              <div>
                de los avisos terminaron <b>Ya en casa</b> 🎉
              </div>
            </div>

            {s.enPausa > 0 && (
              <div className="adm-nota" style={{ marginTop: 10 }}>
                🗂️ {s.enPausa} aviso{s.enPausa === 1 ? '' : 's'} en pausa por inactividad (60+ días sin novedad).
              </div>
            )}

            {empujar && empujar.length > 0 && (
              <>
                <div className="adm-sub">
                  Perdidos que necesitan empujón <span className="adm-sub-n">{empujar.length}</span>
                </div>
                <div className="adm-nota" style={{ marginTop: 0, marginBottom: 8 }}>
                  Perdidos activos hace +7 días. Tocá para abrir y difundir, o pedile al dueño que lo cierre.
                </div>
                <div className="adm-lista">
                  {empujar.map((r) => (
                    <AvisoRow key={r.id} r={r} onOpen={onOpen} pie={pieEmpujon(r)} />
                  ))}
                </div>
              </>
            )}

            <div className="adm-sub">
              Reencuentros — permiso IG / encuesta
              {reencuentros?.length ? <span className="adm-sub-n">{reencuentros.length}</span> : null}
            </div>
            <div className="adm-nota" style={{ marginTop: 0, marginBottom: 8 }}>
              Los "ya en casa" con su contacto. Pedí permiso antes de publicar en IG 🙏
            </div>
            <div className="adm-lista">
              {reencuentros === null ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Cargando…</div>
              ) : reencuentros.length === 0 ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Todavía no hay reencuentros.</div>
              ) : (
                reencuentros.map((r) => (
                  <div className="adm-reenc" key={r.id}>
                    <div className="adm-row-txt">
                      <div className="adm-row-t">{nombreMostrado(r)}</div>
                      <div className="adm-row-s">
                        {ubicacionTexto(r.localidad, r.zona)}
                        {r.resueltoEn ? ` · volvió ${fechaLegible(r.resueltoEn)}` : ''}
                      </div>
                    </div>
                    <div className="adm-reenc-acc">
                      {r.whatsapp ? (
                        <>
                          <a className="adm-reenc-wa" href={linkWhatsAppReencuentro(r)} target="_blank" rel="noreferrer">
                            WhatsApp
                          </a>
                          <a className="adm-reenc-tel" href={linkTel(r.whatsapp)}>Llamar</a>
                        </>
                      ) : r.email ? (
                        <span className="adm-reenc-mail">{r.email}</span>
                      ) : (
                        <span className="adm-row-s">sin contacto</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="adm-sub">Actividad reciente</div>
            <div className="adm-lista">
              {recientes === null ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Cargando…</div>
              ) : recientes.length === 0 ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Todavía no hay avisos.</div>
              ) : (
                recientes.map((r) => <AvisoRow key={r.id} r={r} onOpen={onOpen} />)
              )}
            </div>

            <div className="adm-sub">Avisos nuevos</div>
            <div className="adm-grid tres">
              <Card n={s.avisosHoy} label="Hoy" />
              <Card n={s.avisosMes} label="Este mes" />
              <Card n={s.avisosAnio} label="Este año" />
            </div>

            <div className="adm-sub">Ver un rango de fechas</div>
            <div className="adm-rango">
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
              <span>→</span>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
              <button onClick={verRango} disabled={rangoBusy || !desde || !hasta}>
                {rangoBusy ? '…' : 'Ver'}
              </button>
            </div>
            {rango && (
              <div className="adm-grid tres" style={{ marginTop: 10 }}>
                <Card n={rango.avisos} label="Avisos" color="var(--navy)" />
                <Card n={rango.perdidos} label="Perdidos" color="var(--coral)" />
                <Card n={rango.enLaCalle} label="Encontrados" color="var(--blue)" />
                <Card n={rango.enCasa} label="Ya en casa" color="var(--amber)" />
                <Card n={rango.usuarios} label="Usuarios" />
                <Card n={rango.avistamientos} label="Avistamientos" />
              </div>
            )}

            <div className="adm-sub">Por tipo</div>
            <div className="adm-grid tres">
              <Card n={s.perdidos} label="Perdidos" color="var(--coral)" />
              <Card n={s.enLaCalle} label="Encontrados" color="var(--blue)" />
              <Card n={s.enCasa} label="Ya en casa" color="var(--amber)" />
            </div>

            <div className="adm-sub">Por especie</div>
            <div className="adm-grid tres">
              <Card n={s.perro} label="🐕 Perros" />
              <Card n={s.gato} label="🐈 Gatos" />
              <Card n={s.otro} label="🐾 Otros" />
            </div>

            {porProv && porProv.length > 0 && (
              <>
                <div className="adm-sub">Actividad por provincia (activos)</div>
                <div className="adm-zonas">
                  {porProv.map((p) => {
                    const maxProv = Math.max(1, ...porProv.map((x) => x.total))
                    return (
                      <div className="adm-zona" key={p.provincia}>
                        <div className="adm-zona-t">
                          <span>{p.provincia}</span>
                          <b>{p.total}</b>
                        </div>
                        <div className="adm-zona-bar">
                          <div style={{ width: `${(p.total / maxProv) * 100}%` }} />
                        </div>
                        <div className="adm-zona-s">
                          🔴 {p.perdidos} perdidos · 🔵 {p.encontrados} encontrados
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div className="adm-sub">Avisos por mes (últimos 12)</div>
            <div className="adm-chart">
              {s.avisosPorMes.map((m) => (
                <div className="adm-bar-col" key={m.mes}>
                  <div className="adm-bar-v">{m.total || ''}</div>
                  <div className="adm-bar" style={{ height: `${(m.total / maxMes) * 100}%` }} />
                  <div className="adm-bar-x">{m.mes.slice(5)}</div>
                </div>
              ))}
            </div>

            <div className="adm-sub">Comunidad</div>
            <div className="adm-grid">
              <Card n={s.avistamientos} label="Avistamientos 👀" />
              <Card n={s.seguidores} label="Siguiendo 🔔" />
              <Card n={s.apoyos} label="Apoyos (difusión) 🙌" />
              <Card n={s.pushSubs} label="Con notif. 📲" />
            </div>
            <div className="adm-grid tres">
              <Card n={s.mascotas} label="Mascotas" />
              <Card n={s.ubicaciones} label="Ubicaciones" />
              <Card n={s.notificaciones} label="Notif. enviadas" />
            </div>

            <div className="adm-sub">Barrios más activos</div>
            <div className="adm-zonas">
              {s.topZonas.map((z) => (
                <div className="adm-zona" key={z.zona}>
                  <div className="adm-zona-t">
                    <span>{z.zona}</span>
                    <b>{z.total}</b>
                  </div>
                  <div className="adm-zona-bar">
                    <div style={{ width: `${(z.total / maxZona) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="adm-nota">
              "Apoyos" = veces que tocaron "Me sumo a difundir". Los compartidos directos por WhatsApp no se registran.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
