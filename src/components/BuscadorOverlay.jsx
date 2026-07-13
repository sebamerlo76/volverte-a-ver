import { useMemo } from 'react'
import { nombreMostrado } from '../lib/formato.js'
import { ubicacionTexto } from '../lib/localidades.js'
import { textoEstado } from '../lib/estados.js'
import { coincideBusqueda } from '../lib/buscar.js'

// Buscador flotante (se abre desde la barra inferior). Resultados en vivo.
export default function BuscadorOverlay({ reportes, q, onQ, onOpen, onCerrar }) {
  const texto = q.trim()

  const res = useMemo(() => {
    if (!texto) return []
    // Misma lógica que el filtro del feed (lib/buscar.js), para que coincidan.
    return reportes.filter((r) => coincideBusqueda(r, texto)).slice(0, 40)
  }, [reportes, texto])

  return (
    <div className="buscador">
      <div className="buscador-top">
        <button className="mi bus-back" onClick={onCerrar} aria-label="Cerrar">
          arrow_back
        </button>
        <form
          className="buscador-input"
          onSubmit={(e) => {
            e.preventDefault()
            if (texto) onCerrar() // Enter → cerrar y quedar en el feed ya filtrado
          }}
        >
          <span className="mi" style={{ fontSize: 20, color: '#c9beb6' }}>
            search
          </span>
          <input
            autoFocus
            enterKeyHint="search"
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder="Ej: perro marrón, gato con collar, Centro…"
          />
          {q ? (
            <button type="button" className="mi" style={{ fontSize: 20, color: '#b7aca4' }} onClick={() => onQ('')} aria-label="Borrar">
              close
            </button>
          ) : null}
        </form>
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
                    {ubicacionTexto(r.localidad, r.zona)} · {r.especie === 'perro' ? 'Perro' : r.especie === 'gato' ? 'Gato' : 'Otro'}
                    {r.color ? ` · ${r.color}` : ''}
                  </div>
                </div>
                <span
                  className="bres-badge"
                  style={{ background: resuelto ? '#e0a300' : perdido ? '#ff5747' : '#2f7fed' }}
                >
                  {textoEstado(r)}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
