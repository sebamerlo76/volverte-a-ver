import { useRef, useState } from 'react'
import ImageCropper from './ImageCropper.jsx'

// Selector de hasta `max` fotos, con encuadre (cropper) al elegir cada una.
// value = [{ url, file }], onChange(nuevoArray). La primera es la "principal".
export default function PhotoPicker({ value = [], onChange, max = 3 }) {
  const inputRef = useRef(null)
  const [pendiente, setPendiente] = useState(null) // foto elegida, a la espera de encuadre

  function elegir(e) {
    const f = (e.target.files || [])[0]
    if (f) setPendiente(f)
    e.target.value = ''
  }
  function alConfirmar(blob) {
    const f = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })
    onChange([...value, { url: URL.createObjectURL(blob), file: f }])
    setPendiente(null)
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
      <input ref={inputRef} type="file" accept="image/*" onChange={elegir} style={{ display: 'none' }} />

      {pendiente && <ImageCropper file={pendiente} onConfirm={alConfirmar} onCancel={() => setPendiente(null)} />}
    </div>
  )
}
