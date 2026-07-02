import { useMemo } from 'react'
import { nombreMostrado } from '../lib/formato.js'

// Buscador flotante (se abre desde la barra inferior). Resultados en vivo.
export default function BuscadorOverlay({ reportes, q, onQ, onOpen, onCerrar }) {
  const texto = q.trim().toLowerCase()

  const res = useMemo(() => {
    if (!texto) return []
    return reportes
      .filter((r) =>
        `${r.nombre || ''} ${r.raza || ''} ${r.color || ''} ${r.zona || ''} ${r.especie}`.toLowerCase().includes(texto)
      )
      .slice(0, 40)
  }, [reportes, texto])

  return (
    <div className="buscador">
      <div className="buscador-top">
        <button className="mi bus-back" onClick={onCerrar} aria-label="Cerrar">
          arrow_back
        </button>
        <div className="buscador-input">
          <span className="mi" style={{ fontSize: 20, color: '#c9beb6' }}>
            search
          </span>
          <input autoFocus value={q} onChange={(e) => onQ(e.target.value)} placeholder="Buscar por nombre, barrio, color…" />
          {q ? (
            <button className="mi" style={{ fontSize: 20, color: '#b7aca4' }} onClick={() => onQ('')} aria-label="Borrar">
              close
            </button>
          ) : null}
        </div>
      </div>

      <div className="buscador-res">
        {!texto ? (
          <div className="empty">Escribí para buscar entre los avisos 🐾</div>
        ) : res.length === 0 ? (
          <div className="empty">Sin resultados para “{q}”.</div>
        ) : (
          res.map((r) => {
            const perdido = r.tipo === 'perdido'
            const resuelto = r.estado === 'resuelto'
            return (
              <button className="bres-row" key={r.id} onClick={() => onOpen(r)}>
                <div className="bres-foto">
                  {r.foto ? (
                    <img src={r.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
                  ) : (
                    <span className="mi fill" style={{ fontSize: 22, color: '#c9a58f' }}>
                      pets
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="bres-nombre">{nombreMostrado(r)}</div>
                  <div className="bres-sub">
                    {r.zona} · {r.especie === 'perro' ? 'Perro' : r.especie === 'gato' ? 'Gato' : 'Otro'}
                    {r.color ? ` · ${r.color}` : ''}
                  </div>
                </div>
                <span
                  className="bres-badge"
                  style={{ background: resuelto ? '#17a06b' : perdido ? '#ff5747' : '#17a06b' }}
                >
                  {resuelto ? 'Reencontrado' : perdido ? 'Perdido' : 'Encontrado'}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
