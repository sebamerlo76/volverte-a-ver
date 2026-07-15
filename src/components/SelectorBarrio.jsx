import { useEffect, useRef, useState } from 'react'

// Selector de barrio con búsqueda. En ciudades chicas funciona como un desplegable
// normal (tocás y ves la lista); en las grandes (Córdoba, 400+ barrios) escribís y
// filtra. onSelect recibe el nombre del barrio, o 'Otro' para cargarlo a mano.
//
// vacio: si viene un texto (ej. "Toda la ciudad"), el barrio es OPCIONAL: esa
// opción reemplaza a "Otro…" y devuelve ''. Sin esto no había forma de volver a
// vacío una vez elegido un barrio. Donde el barrio es obligatorio (publicar, un
// avistamiento) no se pasa y queda el "Otro… (escribir a mano)" de siempre.
export default function SelectorBarrio({ opciones, value, onSelect, vacio = null }) {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const boxRef = useRef(null)

  const esConocido = opciones.includes(value)
  const enVacio = !!vacio && !value
  const texto = abierto ? q : esConocido ? value : enVacio ? vacio : 'Otro…'

  useEffect(() => {
    if (!abierto) return
    function fuera(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('touchstart', fuera)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('touchstart', fuera)
    }
  }, [abierto])

  const filtro = q.trim().toLowerCase()
  const lista = (filtro ? opciones.filter((b) => b.toLowerCase().includes(filtro)) : opciones).slice(0, 60)

  function elegir(val) {
    onSelect(val)
    setAbierto(false)
    setQ('')
  }

  return (
    <div className="barrio-sel" ref={boxRef}>
      <div className="inp" onClick={() => !abierto && (setAbierto(true), setQ(''))}>
        <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
          location_on
        </span>
        <input
          value={texto}
          onChange={(e) => {
            setQ(e.target.value)
            if (!abierto) setAbierto(true)
          }}
          onFocus={() => {
            setAbierto(true)
            setQ('')
          }}
          placeholder="Buscá tu barrio…"
        />
        <span className="mi" style={{ fontSize: 22, color: 'var(--muted)' }}>
          {abierto ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      {abierto && (
        <div className="barrio-lista">
          {lista.map((b) => (
            <button type="button" key={b} className={'barrio-op' + (b === value ? ' on' : '')} onClick={() => elegir(b)}>
              {b}
            </button>
          ))}
          {filtro && lista.length === 0 && <div className="barrio-vacio">Sin resultados</div>}
          {vacio ? (
            <button type="button" className={'barrio-op ninguno' + (enVacio ? ' on' : '')} onClick={() => elegir('')}>
              {vacio}
            </button>
          ) : (
            <button type="button" className="barrio-op otro" onClick={() => elegir('Otro')}>
              Otro… (escribir a mano)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
