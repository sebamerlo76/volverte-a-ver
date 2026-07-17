import { useEffect, useState } from 'react'
import { sumarAplauso } from '../data/store.js'

// Aplauso 👏 de un reencuentro: una vez por dispositivo, sin login. La marca de "ya
// aplaudí" vive en localStorage (chicho_aplausos), igual que los apoyos.
//
// Está en un hook porque lo usan DOS lugares: el aviso (Detalle) y la tarjeta del
// feed (PetCard). Si estuviera copiado en los dos, tarde o temprano se desincronizan.
const CLAVE = 'chicho_aplausos'

function yaAplaudido(id) {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '[]').includes(id)
  } catch (e) {
    return false
  }
}
function marcarAplaudido(id) {
  try {
    const a = JSON.parse(localStorage.getItem(CLAVE) || '[]')
    if (!a.includes(id)) {
      a.push(id)
      localStorage.setItem(CLAVE, JSON.stringify(a))
    }
  } catch (e) {
    /* ignore */
  }
}

// Devuelve { aplausos, aplaudido, aplaudir }. Solo hace algo si el aviso está resuelto.
export function useAplauso(r) {
  const [aplausos, setAplausos] = useState(r?.aplausos || 0)
  const [aplaudido, setAplaudido] = useState(false)

  useEffect(() => {
    if (r?.estado !== 'resuelto') return // solo los reencuentros se aplauden
    setAplausos(r?.aplausos || 0)
    setAplaudido(yaAplaudido(r?.id))
  }, [r?.id, r?.aplausos, r?.estado])

  async function aplaudir() {
    if (aplaudido || !r?.id) return
    setAplaudido(true)
    setAplausos((n) => n + 1)
    marcarAplaudido(r.id) // antes del await: evita que un doble toque dispare 2 RPC
    try {
      const total = await sumarAplauso(r.id)
      if (typeof total === 'number') setAplausos(total)
    } catch (e) {
      console.error(e) // el +1 optimista queda igual
    }
  }

  return { aplausos, aplaudido, aplaudir }
}
