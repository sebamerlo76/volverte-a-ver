import { useRef } from 'react'

// Selector de hasta `max` fotos. value = [{ url, file }], onChange(nuevoArray).
// La primera foto es la "principal" (thumbnail de tarjetas + huella visual).
export default function PhotoPicker({ value = [], onChange, max = 3 }) {
  const inputRef = useRef(null)

  function agregar(e) {
    const files = Array.from(e.target.files || [])
    const libres = max - value.length
    const nuevas = files.slice(0, libres).map((f) => ({ url: URL.createObjectURL(f), file: f }))
    if (nuevas.length) onChange([...value, ...nuevas])
    e.target.value = ''
  }
  function quitar(i) {
    onChange(value.filter((_, j) => j !== i))
  }

  return (
    <div className="fotos-grid">
      {value.map((f, i) => (
        <div className="foto-slot" key={i}>
          <img src={f.url} alt="" onError={(e) => (e.target.style.opacity = 0.3)} />
          <button type="button" className="foto-x" onClick={() => quitar(i)} aria-label="Quitar foto">
            <span className="mi" style={{ fontSize: 15 }}>
              close
            </span>
          </button>
          {i === 0 && max > 1 && <span className="foto-main">Principal</span>}
        </div>
      ))}
      {value.length < max && (
        <button type="button" className="foto-add" onClick={() => inputRef.current?.click()}>
          <span className="mi" style={{ fontSize: 26 }}>
            add_a_photo
          </span>
          <span style={{ fontSize: 11, fontWeight: 800 }}>Agregar</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={agregar} style={{ display: 'none' }} />
    </div>
  )
}
