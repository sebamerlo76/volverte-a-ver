import { useState } from 'react'
import { nombreMostrado } from '../lib/formato.js'
import PhotoPicker from './PhotoPicker.jsx'
import { subirFoto, guardarFotoReencuentro } from '../data/store.js'

// Cartelito que aparece al marcar un aviso como "volvió a casa": festeja, pide LA
// FOTO del reencuentro (es el pico de emoción — acá es cuando la suben) e invita a
// compartir la buena noticia. La foto alimenta el muro de "Ya en casa" (prueba
// social: el que entra ve resultados, no solo búsquedas).
export default function FestejoReencuentro({ r, onCompartir, onCerrar, onToast, onFotoSubida }) {
  const [fotos, setFotos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [subida, setSubida] = useState(false)

  if (!r) return null

  // Apenas elige la foto (ya recortada por el cropper), la subimos sin más pasos.
  async function cambioFoto(arr) {
    setFotos(arr)
    const it = arr[0]
    if (!it || subiendo || subida) return
    setSubiendo(true)
    try {
      const url = await subirFoto(it.thumb)
      await guardarFotoReencuentro(r.id, url)
      setSubida(true)
      onToast?.('📸 ¡Gracias! Ya está en el muro de Ya en casa 💛')
      onFotoSubida?.()
    } catch (e) {
      console.error('foto reencuentro', e)
      setFotos([])
      onToast?.('No se pudo subir la foto. Probá de nuevo 🔄')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="festejo-ov" onClick={onCerrar}>
      <div className="festejo-box" onClick={(e) => e.stopPropagation()}>
        <div className="festejo-emoji">🎉</div>
        <div className="festejo-t">¡{nombreMostrado(r)} volvió a casa!</div>
        <div className="festejo-s">
          Qué alegría 🐾 ¿Le sacaste una foto del reencuentro? Subila así todos ven que las búsquedas terminan bien.
        </div>

        <div className="festejo-foto">
          {subida ? (
            <div className="festejo-foto-ok">✅ ¡Foto subida! Gracias por compartir la alegría.</div>
          ) : (
            <>
              <PhotoPicker value={fotos} onChange={cambioFoto} max={1} />
              {subiendo && <div className="festejo-foto-sub">Subiendo la foto…</div>}
            </>
          )}
        </div>

        <button className="festejo-btn" onClick={onCompartir}>
          <span className="mi fill" style={{ fontSize: 22 }}>
            ios_share
          </span>
          Compartir el reencuentro
        </button>
        <button className="festejo-cerrar" onClick={onCerrar}>
          {subida ? 'Listo' : 'Ahora no'}
        </button>
      </div>
    </div>
  )
}
