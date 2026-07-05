import { useEffect, useState } from 'react'
import { getAdminStats } from '../data/store.js'

function Card({ n, label, color }) {
  return (
    <div className="adm-card">
      <div className="adm-n" style={color ? { color } : undefined}>{n ?? '—'}</div>
      <div className="adm-l">{label}</div>
    </div>
  )
}

export default function Admin({ onVolver, stats }) {
  const [s, setS] = useState(stats || null)
  const [error, setError] = useState('')

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
              <Card n={s.enCasa} label="En casa 🏠" color="var(--amber)" />
            </div>

            <div className="adm-exito">
              <div className="adm-exito-n">{exito}%</div>
              <div>
                de los avisos terminaron <b>En casa</b> 🎉
              </div>
            </div>

            <div className="adm-sub">Avisos nuevos</div>
            <div className="adm-grid tres">
              <Card n={s.avisosHoy} label="Hoy" />
              <Card n={s.avisosMes} label="Este mes" />
              <Card n={s.avisosAnio} label="Este año" />
            </div>

            <div className="adm-sub">Por tipo</div>
            <div className="adm-grid tres">
              <Card n={s.perdidos} label="Perdidos" color="var(--coral)" />
              <Card n={s.enLaCalle} label="En la calle" color="var(--blue)" />
              <Card n={s.enCasa} label="En casa" color="var(--amber)" />
            </div>

            <div className="adm-sub">Por especie</div>
            <div className="adm-grid tres">
              <Card n={s.perro} label="🐕 Perros" />
              <Card n={s.gato} label="🐈 Gatos" />
              <Card n={s.otro} label="🐾 Otros" />
            </div>

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
