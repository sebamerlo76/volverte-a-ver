import { useEffect, useState } from 'react'
import { getModeracion, desbloquearReporte, borrarReporteAdmin, banearUsuario, desbanearUsuario } from '../data/store.js'
import { tiempoRelativo } from '../lib/formato.js'

export default function Moderacion({ onVolver, data: dataProp }) {
  const [data, setData] = useState(dataProp || null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function cargar() {
    try {
      setData(await getModeracion())
    } catch (e) {
      setError(e?.message || 'Error')
    }
  }
  useEffect(() => {
    if (!dataProp) cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function accion(fn, ...args) {
    if (busy) return
    setBusy(true)
    try {
      await fn(...args)
      await cargar()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onVolver}>
          arrow_back
        </button>
        <div className="ftitle">Moderación 🛡️</div>
      </div>

      <div className="body" style={{ padding: '6px 16px 34px' }}>
        {error ? (
          <div className="empty" style={{ padding: '30px' }}>
            No se pudo cargar.
            <br />
            <span style={{ fontSize: 12, color: 'var(--faint)' }}>{error}</span>
          </div>
        ) : !data ? (
          <div className="empty" style={{ padding: '30px' }}>Cargando…</div>
        ) : (
          <>
            <div className="adm-sub">Avisos reportados</div>
            {data.avisos.length === 0 ? (
              <div className="empty" style={{ padding: '16px 20px' }}>Nada reportado por ahora 🎉</div>
            ) : (
              data.avisos.map((a) => (
                <div className="mod-card" key={a.id}>
                  <div className="mod-top">
                    <div className="mod-foto">
                      {a.foto ? (
                        <img src={a.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
                      ) : (
                        <span className="mi fill" style={{ fontSize: 22, color: '#c9a58f' }}>
                          pets
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mod-nombre">
                        {a.nombre || (a.tipo === 'perdido' ? 'Perdido' : 'En la calle')}
                        {a.bloqueado && <span className="mod-badge">Bloqueado</span>}
                      </div>
                      <div className="mod-sub">
                        {a.zona} · {a.autor || 'Anónimo'} · {a.denuncias} denuncia{a.denuncias === 1 ? '' : 's'}
                      </div>
                      {a.motivos?.length ? (
                        <div className="mod-motivos">
                          {a.motivos.map((m, i) => (
                            <span className="mod-motivo" key={i}>
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mod-acciones">
                    <button className="mod-btn ok" onClick={() => accion(desbloquearReporte, a.id)}>
                      {a.bloqueado ? 'Desbloquear' : 'Descartar reportes'}
                    </button>
                    <button
                      className="mod-btn del"
                      onClick={() => window.confirm('¿Borrar este aviso? No se puede deshacer.') && accion(borrarReporteAdmin, a.id)}
                    >
                      Borrar
                    </button>
                    {a.userId && (
                      <button
                        className="mod-btn ban"
                        onClick={() =>
                          window.confirm('¿Banear al autor? No podrá publicar y se ocultan sus avisos.') && accion(banearUsuario, a.userId)
                        }
                      >
                        Banear autor
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="adm-sub">Usuarios baneados</div>
            {data.baneados.length === 0 ? (
              <div className="empty" style={{ padding: '16px 20px' }}>Ninguno.</div>
            ) : (
              data.baneados.map((b) => (
                <div className="mod-baneado" key={b.userId}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mod-nombre">{b.email || b.userId}</div>
                    <div className="mod-sub">Baneado {tiempoRelativo(b.desde)}</div>
                  </div>
                  <button className="mod-btn ok" onClick={() => accion(desbanearUsuario, b.userId)}>
                    Desbanear
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
