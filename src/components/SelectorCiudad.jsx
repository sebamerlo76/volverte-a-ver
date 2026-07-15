import { useMemo, useState } from 'react'
import { provinciasOrdenadas, ciudadesDeProvincia, provinciaDe, NOMBRES_LOCALIDADES } from '../lib/localidades.js'

// Hoja para elegir ciudad. Drill-down provincia → ciudad, con buscador para saltear
// los dos toques cuando ya sabés qué querés (y para cuando esté toda la Argentina y
// scrollear no sea opción). Reemplaza al <select> nativo, que lo dibujaba el celu y
// desentonaba con el resto.
//
// La usan el feed y los dos flujos de publicar. Se diferencian en el alcance:
// el feed puede mirar "Todas" o una provincia entera, pero un aviso se publica
// SIEMPRE desde una ciudad real. Por eso esas dos opciones son opt-in.
export default function SelectorCiudad({
  titulo = '¿Qué ciudad?',
  ciudad = null, // ciudad marcada con el tilde
  provincia = null, // provincia marcada (solo con onProvincia)
  todas = false, // ¿está marcado "Todas"? (solo con onTodas)
  onCiudad,
  onProvincia, // si no viene, no se ofrece "Toda la provincia"
  onTodas, // si no viene, no se ofrece "Todas"
  onCerrar,
}) {
  // Si ya hay algo elegido, entramos directo a su provincia: es lo más probable
  // que quieras tocar, y te ahorra el primer nivel.
  const [provSel, setProvSel] = useState(ciudad ? provinciaDe(ciudad) : provincia || null)
  const [q, setQ] = useState('')

  const filtro = q.trim().toLowerCase()
  // Con búsqueda el drill-down estorba: mostramos las coincidencias de todo el país,
  // planas y con la provincia al lado (hay ciudades homónimas: Córdoba, Santa Fe,
  // San Juan son ciudad y provincia a la vez).
  const resultados = useMemo(() => {
    if (!filtro) return []
    return NOMBRES_LOCALIDADES.filter((l) => l.toLowerCase().includes(filtro))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .slice(0, 40)
  }, [filtro])

  const buscando = !!filtro

  return (
    <div className="pp-sheet-ov" onClick={onCerrar}>
      <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ciudad-buscar">
          <span className="mi" style={{ fontSize: 20, color: 'var(--muted)' }}>
            search
          </span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ciudad…" />
          {q && (
            <button type="button" className="ciudad-buscar-x" onClick={() => setQ('')} aria-label="Borrar búsqueda">
              <span className="mi" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>

        {buscando ? (
          <>
            {resultados.map((l) => (
              <button className="pp-op" key={l} onClick={() => onCiudad(l)}>
                <span className="mi fill" style={{ fontSize: 20, color: 'var(--navy)' }}>
                  location_on
                </span>
                {l}
                <span className="ciudad-prov">{provinciaDe(l)}</span>
                {ciudad === l && (
                  <span className="mi" style={{ marginLeft: 6, color: 'var(--navy)' }}>
                    check
                  </span>
                )}
              </button>
            ))}
            {resultados.length === 0 && (
              <div className="ciudad-vacio">
                No encontramos <b>“{q.trim()}”</b>.
                <br />
                Si tu ciudad no está todavía, escribinos y la sumamos. 💜
              </div>
            )}
          </>
        ) : provSel === null ? (
          <>
            <div className="report-sheet-t">{titulo}</div>
            {onTodas && (
              <>
                <button className="pp-op" onClick={onTodas}>
                  <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
                    public
                  </span>
                  Todas
                  {todas && (
                    <span className="mi" style={{ marginLeft: 'auto', color: 'var(--navy)' }}>
                      check
                    </span>
                  )}
                </button>
                <div className="ciudad-sep" />
              </>
            )}
            {provinciasOrdenadas().map((p) => (
              <button className="pp-op" key={p} onClick={() => setProvSel(p)}>
                <span className="mi fill" style={{ fontSize: 20, color: 'var(--navy)' }}>
                  location_on
                </span>
                {p}
                <span className="mi" style={{ marginLeft: 'auto', fontSize: 20, color: '#b9ada3' }}>
                  chevron_right
                </span>
              </button>
            ))}
          </>
        ) : (
          <>
            <button className="pp-sheet-back" onClick={() => setProvSel(null)}>
              <span className="mi" style={{ fontSize: 22 }}>
                arrow_back
              </span>
              {provSel}
            </button>
            {onProvincia && ciudadesDeProvincia(provSel).length > 1 && (
              <>
                <button className="pp-op" onClick={() => onProvincia(provSel)}>
                  <span className="mi fill" style={{ fontSize: 20, color: 'var(--navy)' }}>
                    select_all
                  </span>
                  Toda la provincia
                  {provincia === provSel && (
                    <span className="mi" style={{ marginLeft: 'auto', color: 'var(--navy)' }}>
                      check
                    </span>
                  )}
                </button>
                <div className="ciudad-sep" />
              </>
            )}
            {ciudadesDeProvincia(provSel).map((l) => (
              <button className="pp-op" key={l} onClick={() => onCiudad(l)}>
                <span className="mi fill" style={{ fontSize: 20, color: 'var(--navy)' }}>
                  location_on
                </span>
                {l}
                {ciudad === l && (
                  <span className="mi" style={{ marginLeft: 'auto', color: 'var(--navy)' }}>
                    check
                  </span>
                )}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
