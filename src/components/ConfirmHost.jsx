import { useEffect, useState } from 'react'
import { _registrarConfirm } from '../lib/confirmar.js'

// Cartel de confirmación propio (en vez del window.confirm nativo, que muestra
// el dominio). Se monta una sola vez en main.jsx.
export default function ConfirmHost() {
  const [st, setSt] = useState(null)

  useEffect(() => {
    _registrarConfirm((o) => setSt(o))
  }, [])

  if (!st) return null

  const cerrar = (valor) => {
    st.resolve(valor)
    setSt(null)
  }

  return (
    <div className="confirm-ov" onClick={() => cerrar(false)}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        {st.titulo && <div className="confirm-t">{st.titulo}</div>}
        <div className="confirm-msg">{st.mensaje}</div>
        <div className="confirm-btns">
          <button className="confirm-cancel" onClick={() => cerrar(false)}>
            {st.cancelar || 'Cancelar'}
          </button>
          <button className={'confirm-ok' + (st.peligro ? ' danger' : '')} onClick={() => cerrar(true)}>
            {st.aceptar || 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  )
}
