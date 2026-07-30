import { useEffect, useState } from 'react'
import { getAdminStats, getAdminStatsRango, getActividadReciente, getPerdidosParaEmpujar, getActivosPorProvincia, getReencuentros, getReportes, guardarEmbeddingAdmin, getNovedades, crearNovedad, borrarNovedad } from '../data/store.js'
import { confirmar } from '../lib/confirmar.js'
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

// Sección plegable del panel. Arriba lo que se ACCIONA (abierto), abajo los números
// (cerrado): el panel se hizo largo y había que scrollear todo para llegar a lo útil.
function Sec({ id, titulo, n, sub, abierta, onToggle, children }) {
  return (
    <div className={'adm-sec' + (abierta ? ' abierta' : '')}>
      <button type="button" className="adm-sec-h" onClick={() => onToggle(id)}>
        <span className="adm-sec-t">{titulo}</span>
        {n != null && <span className="adm-sub-n">{n}</span>}
        <span className="mi adm-sec-ch">{abierta ? 'expand_less' : 'expand_more'}</span>
      </button>
      {abierta && (
        <div className="adm-sec-b">
          {sub && <div className="adm-nota" style={{ marginTop: 0, marginBottom: 8 }}>{sub}</div>}
          {children}
        </div>
      )}
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
  // Qué secciones arrancan abiertas: las accionables. Los números, cerrados.
  const [abiertas, setAbiertas] = useState({ empujon: true, reencuentros: true })
  const toggle = (id) => setAbiertas((a) => ({ ...a, [id]: !a[id] }))

  useEffect(() => {
    getActividadReciente(15).then(setRecientes).catch(() => setRecientes([]))
    getPerdidosParaEmpujar(7, 20).then(setEmpujar).catch(() => setEmpujar([]))
    getActivosPorProvincia().then(setPorProv).catch(() => setPorProv([]))
    getReencuentros().then(setReencuentros).catch(() => setReencuentros([]))
  }, [])

  // Recalcula la huella visual de todos los activos con foto, desde el RECORTE del
  // feed (r.foto). Corre acá, en el navegador del admin: baja el modelo una vez y va
  // aviso por aviso. Si el SQL de huellas no está corrido, el primer guardado grita.
  const [huellasBusy, setHuellasBusy] = useState(false)
  const [huellasProg, setHuellasProg] = useState('')
  async function recalcularHuellas() {
    if (huellasBusy) return
    setHuellasBusy(true)
    setHuellasProg('Preparando el modelo…')
    try {
      const m = await import('../lib/similar.js')
      const todos = (await getReportes()).filter((r) => r.foto)
      let ok = 0
      let fallo = 0
      for (let i = 0; i < todos.length; i++) {
        setHuellasProg(`Procesando ${i + 1} de ${todos.length}…`)
        try {
          const emb = await m.huellaDeImagen(todos[i].foto)
          if (!emb) throw new Error('la imagen no dio huella')
          await guardarEmbeddingAdmin(todos[i].id, emb)
          ok++
        } catch (e) {
          console.error('huella', todos[i].id, e)
          fallo++
        }
      }
      setHuellasProg(`Listo: ${ok} recalculadas${fallo ? ` · ${fallo} fallaron (detalle en la consola)` : ''} ✅`)
    } catch (e) {
      console.error(e)
      setHuellasProg(`No se pudo: ${e?.message || 'error'} — ¿está corrido schema-huellas-admin.sql?`)
    } finally {
      setHuellasBusy(false)
    }
  }

  // --- Novedades: contar una mejora y que llegue como push ---
  const [novTitulo, setNovTitulo] = useState('')
  const [novTexto, setNovTexto] = useState('')
  const [novBusy, setNovBusy] = useState(false)
  const [novedades, setNovedades] = useState(null)

  useEffect(() => {
    getNovedades().then(setNovedades).catch(() => setNovedades([]))
  }, [])

  async function publicarNovedad() {
    if (novBusy) return
    const t = novTitulo.trim()
    const x = novTexto.trim()
    if (!t || !x) return
    // Va a TODOS los que tienen los avisos activados: conviene pensarlo dos veces.
    if (!(await confirmar({ mensaje: `¿Enviar "${t}" a todos los que tienen avisos activados?`, aceptar: 'Enviar' }))) return
    setNovBusy(true)
    try {
      await crearNovedad(t, x)
      setNovTitulo('')
      setNovTexto('')
      // El conteo de enviados lo escribe la Edge Function un instante después.
      setTimeout(() => getNovedades().then(setNovedades).catch(() => {}), 2500)
      setNovedades(await getNovedades())
    } catch (e) {
      console.error(e)
      alert('No se pudo publicar: ' + (e?.message || 'error') + '\n¿Está corrido schema-novedades.sql?')
    } finally {
      setNovBusy(false)
    }
  }

  async function quitarNovedad(id) {
    if (!(await confirmar({ mensaje: '¿Borrar esta novedad del historial?', aceptar: 'Borrar', peligro: true }))) return
    try {
      await borrarNovedad(id)
      setNovedades(await getNovedades())
    } catch (e) {
      console.error(e)
    }
  }

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
  const conFoto = reencuentros ? reencuentros.filter((r) => r.fotoReencuentro).length : 0
  // Personas con push. Si el SQL nuevo (pushUsuarios) no está corrido todavía, caemos
  // a los dispositivos: sobrestima un poco (celu + tablet = 2) pero no miente el orden
  // de magnitud ni deja la tarjeta vacía.
  const pushUsuarios = s ? (s.pushUsuarios ?? s.pushSubs) : null
  const pushPct = s && s.usuarios ? Math.round((pushUsuarios / s.usuarios) * 100) : 0

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
            {/* ---- Resumen: lo único siempre a la vista ---- */}
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

            {/* ---- Para hacer (abiertas) ---- */}
            <Sec
              id="empujon"
              titulo="🔔 Perdidos que necesitan empujón"
              n={empujar ? empujar.length : null}
              sub="Perdidos activos hace +7 días. Tocá para abrir y difundir, o pedile al dueño que lo cierre."
              abierta={!!abiertas.empujon}
              onToggle={toggle}
            >
              {empujar === null ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Cargando…</div>
              ) : empujar.length === 0 ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>✅ Ninguno pendiente — todo al día.</div>
              ) : (
                <div className="adm-lista">
                  {empujar.map((r) => (
                    <AvisoRow key={r.id} r={r} onOpen={onOpen} pie={pieEmpujon(r)} />
                  ))}
                </div>
              )}
            </Sec>

            <Sec
              id="reencuentros"
              titulo="🏠 Reencuentros — permiso IG"
              n={reencuentros ? reencuentros.length : null}
              sub={`Los "ya en casa" con su contacto. Pedí permiso antes de publicar en IG 🙏${
                reencuentros && reencuentros.length ? ` · ${conFoto} con foto del reencuentro 📸` : ''
              }`}
              abierta={!!abiertas.reencuentros}
              onToggle={toggle}
            >
              {reencuentros === null ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Cargando…</div>
              ) : reencuentros.length === 0 ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Todavía no hay reencuentros.</div>
              ) : (
                <div className="adm-lista">
                  {reencuentros.map((r) => (
                    <div className="adm-reenc" key={r.id}>
                      {r.fotoReencuentro ? (
                        <img className="adm-reenc-foto" src={r.fotoReencuentro} alt="" loading="lazy" onError={(e) => (e.target.style.display = 'none')} />
                      ) : null}
                      <div className="adm-row-txt">
                        <div className="adm-row-t">
                          {nombreMostrado(r)} {r.fotoReencuentro ? '📸' : ''}
                        </div>
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
                  ))}
                </div>
              )}
            </Sec>

            <Sec
              id="novedades"
              titulo="✨ Contar una novedad"
              n={novedades ? novedades.length : null}
              sub="Se manda como push a los que tienen los avisos activados, y queda en la pantalla Novedades para todos."
              abierta={!!abiertas.novedades}
              onToggle={toggle}
            >
              <input
                className="fp-buscar"
                value={novTitulo}
                onChange={(e) => setNovTitulo(e.target.value)}
                placeholder="Título — ej: Ahora podés subir la foto del reencuentro"
                maxLength={70}
              />
              <textarea
                className="ta"
                style={{ marginTop: 8 }}
                value={novTexto}
                onChange={(e) => setNovTexto(e.target.value)}
                placeholder="Contalo en dos líneas, como se lo contarías a un vecino."
                maxLength={280}
              />
              <button className="adm-btn" style={{ marginTop: 8 }} onClick={publicarNovedad} disabled={novBusy || !novTitulo.trim() || !novTexto.trim()}>
                {novBusy ? 'Enviando…' : '📣 Publicar y avisar'}
              </button>

              {novedades && novedades.length > 0 && (
                <>
                  <div className="adm-sub2">Historial</div>
                  <div className="adm-lista">
                    {novedades.map((n) => (
                      <div className="adm-reenc" key={n.id}>
                        <div className="adm-row-txt">
                          <div className="adm-row-t">{n.titulo}</div>
                          <div className="adm-row-s">
                            {fechaLegible(n.creadoEn)} · {n.enviados} push
                          </div>
                        </div>
                        <button className="adm-reenc-tel" onClick={() => quitarNovedad(n.id)}>
                          Borrar
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Sec>

            <Sec
              id="actividad"
              titulo="🕒 Actividad reciente"
              n={recientes ? recientes.length : null}
              abierta={!!abiertas.actividad}
              onToggle={toggle}
            >
              {recientes === null ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Cargando…</div>
              ) : recientes.length === 0 ? (
                <div className="adm-nota" style={{ marginTop: 0 }}>Todavía no hay avisos.</div>
              ) : (
                <div className="adm-lista">
                  {recientes.map((r) => (
                    <AvisoRow key={r.id} r={r} onOpen={onOpen} />
                  ))}
                </div>
              )}
            </Sec>

            {/* ---- Números (cerradas) ---- */}
            <Sec id="numeros" titulo="📈 Números" abierta={!!abiertas.numeros} onToggle={toggle}>
              <div className="adm-sub2">Avisos nuevos</div>
              <div className="adm-grid tres">
                <Card n={s.avisosHoy} label="Hoy" />
                <Card n={s.avisosMes} label="Este mes" />
                <Card n={s.avisosAnio} label="Este año" />
              </div>

              {/* "Ya en casa" no se repite acá: ya está en el resumen de arriba. */}
              <div className="adm-sub2">Por tipo (activos y cerrados)</div>
              <div className="adm-grid">
                <Card n={s.perdidos} label="Perdidos" color="var(--coral)" />
                <Card n={s.enLaCalle} label="Encontrados" color="var(--blue)" />
              </div>

              <div className="adm-sub2">Por especie</div>
              <div className="adm-grid tres">
                <Card n={s.perro} label="🐕 Perros" />
                <Card n={s.gato} label="🐈 Gatos" />
                <Card n={s.otro} label="🐾 Otros" />
              </div>

              <div className="adm-sub2">Avisos por mes (últimos 12)</div>
              <div className="adm-chart">
                {s.avisosPorMes.map((m) => (
                  <div className="adm-bar-col" key={m.mes}>
                    <div className="adm-bar-v">{m.total || ''}</div>
                    <div className="adm-bar" style={{ height: `${(m.total / maxMes) * 100}%` }} />
                    <div className="adm-bar-x">{m.mes.slice(5)}</div>
                  </div>
                ))}
              </div>

              <div className="adm-sub2">Ver un rango de fechas</div>
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
            </Sec>

            <Sec id="zonas" titulo="🗺️ Dónde está pasando" abierta={!!abiertas.zonas} onToggle={toggle}>
              {porProv && porProv.length > 0 && (
                <>
                  <div className="adm-sub2">Por provincia (activos)</div>
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
              <div className="adm-sub2">Barrios más activos</div>
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
            </Sec>

            <Sec id="comunidad" titulo="👥 Comunidad" abierta={!!abiertas.comunidad} onToggle={toggle}>
              {/* El push es el corazón de Chicho (avisar en la primera hora): lo que
                  importa es qué TAJADA de los usuarios lo tiene, no el número suelto. */}
              <div className="adm-exito" style={{ marginTop: 0 }}>
                <div className="adm-exito-n">{pushPct}%</div>
                <div>
                  de los usuarios tiene los <b>avisos activados</b> 🔔
                  <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.8, marginTop: 2 }}>
                    {pushUsuarios ?? '—'} de {s.usuarios ?? '—'} personas · {s.pushSubs ?? '—'} dispositivos
                  </div>
                </div>
              </div>
              <div className="adm-grid" style={{ marginTop: 10 }}>
                <Card n={s.avistamientos} label="Avistamientos 👀" />
                <Card n={s.seguidores} label="Siguiendo 🔔" />
                <Card n={s.apoyos} label="Apoyos (difusión) 🙌" />
                <Card n={s.notificaciones} label="Notif. enviadas" />
              </div>
              <div className="adm-grid">
                <Card n={s.mascotas} label="Mascotas" />
                <Card n={s.ubicaciones} label="Ubicaciones" />
              </div>
              <div className="adm-nota">
                "Apoyos" = veces que tocaron "Me sumo a difundir". Los compartidos directos por WhatsApp no se registran.
              </div>
            </Sec>

            <Sec id="herramientas" titulo="🛠️ Herramientas" abierta={!!abiertas.herramientas} onToggle={toggle}>
              <div className="adm-nota" style={{ marginTop: 0, marginBottom: 8 }}>
                Regenera la huella visual de los avisos activos desde el recorte del feed — mejora los "parecidos por
                foto". Correr solo si se cambió el modelo o quedaron huellas viejas; tarda un ratito.
              </div>
              <button className="adm-btn" onClick={recalcularHuellas} disabled={huellasBusy}>
                {huellasBusy ? 'Recalculando…' : '🔍 Recalcular huellas visuales'}
              </button>
              {huellasProg && (
                <div className="adm-nota" style={{ marginTop: 6 }}>
                  {huellasProg}
                </div>
              )}
            </Sec>
          </>
        )}
      </div>
    </div>
  )
}
