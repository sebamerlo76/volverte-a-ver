import { useMemo } from 'react'
import { nombreMostrado } from '../lib/formato.js'
import { ubicacionTexto } from '../lib/localidades.js'
import { textoEstado } from '../lib/estados.js'

// Saca acentos y pasa a minúsculas: así "marron" encuentra "Marrón".
function normaliza(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Palabras vacías que no aportan al filtrar. Ojo: dejamos "con"/"sin" a propósito,
// porque son parte del collar ("Con collar" / "Sin collar").
const VACIAS = new Set(['y', 'o', 'a', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'que', 'por', 'para'])

// Sinónimos de especie para que ande en singular/plural/género.
const ESPECIE_TXT = { perro: 'perro perra perros', gato: 'gato gata gatos', otro: 'otro' }

// Texto buscable de un aviso: junta todos los campos útiles, ya normalizado.
function textoDe(r) {
  return normaliza(
    [
      nombreMostrado(r),
      ESPECIE_TXT[r.especie] || r.especie,
      r.tipo, // perdido / encontrado
      r.color,
      r.tamano,
      r.sexo,
      r.collar,
      r.zona,
      r.referencia,
      r.raza,
      r.edad,
      r.descripcion,
    ]
      .filter(Boolean)
      .join(' ')
  )
}

// Buscador flotante (se abre desde la barra inferior). Resultados en vivo.
export default function BuscadorOverlay({ reportes, q, onQ, onOpen, onCerrar }) {
  const texto = q.trim()

  // Texto buscable por aviso (se recalcula solo si cambian los avisos).
  const indexados = useMemo(() => reportes.map((r) => ({ r, t: textoDe(r) })), [reportes])

  const res = useMemo(() => {
    // Cada palabra debe aparecer en algún campo (AND). "gato con collar" => gato + collar.
    const palabras = normaliza(texto)
      .split(/\s+/)
      .filter((w) => w && !VACIAS.has(w))
    if (palabras.length === 0) return []
    return indexados
      .filter(({ t }) => palabras.every((w) => t.includes(w)))
      .map(({ r }) => r)
      .slice(0, 40)
  }, [indexados, texto])

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
