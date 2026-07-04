import { useRef, useState } from 'react'
import ImageCropper from './ImageCropper.jsx'

// Selector de hasta `max` fotos, con encuadre (cropper) al elegir cada una.
// Ofrece Cámara o Galería explícitamente (así en Android siempre se puede sacar foto).
// value = [{ url, file }], onChange(nuevoArray). La primera es la "principal".
export default function PhotoPicker({ value = [], onChange, max = 3 }) {
  const camRef = useRef(null)
  const galRef = useRef(null)
  const [pendiente, setPendiente] = useState(null) // foto elegida, a la espera de encuadre
  const [sheet, setSheet] = useState(false)

  function elegir(e) {
    const f = (e.target.files || [])[0]
    if (f) setPendiente(f)
    e.target.value = ''
    setSheet(false)
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
        <button type="button" className="foto-add" onClick={() => setSheet(true)}>
          <span className="mi" style={{ fontSize: 26 }}>
            add_a_photo
          </span>
          <span style={{ fontSize: 11, fontWeight: 800 }}>Agregar</span>
        </button>
      )}

      {/* Cámara (capture) y galería, por separado */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={elegir} style={{ display: 'none' }} />
      <input ref={galRef} type="file" accept="image/*" onChange={elegir} style={{ display: 'none' }} />

      {sheet && (
        <div className="pp-sheet-ov" onClick={() => setSheet(false)}>
          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="pp-op" onClick={() => camRef.current?.click()}>
              <span className="mi" style={{ fontSize: 24, color: 'var(--navy)' }}>
                photo_camera
              </span>
              Tomar foto
            </button>
            <button className="pp-op" onClick={() => galRef.current?.click()}>
              <span className="mi" style={{ fontSize: 24, color: 'var(--navy)' }}>
                image
              </span>
              Elegir de la galería
            </button>
            <button className="pp-cancel" onClick={() => setSheet(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pendiente && <ImageCropper file={pendiente} onConfirm={alConfirmar} onCancel={() => setPendiente(null)} />}
    </div>
  )
}
