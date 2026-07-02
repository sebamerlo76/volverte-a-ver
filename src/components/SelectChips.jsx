import { useState } from 'react'

// Selector de opciones en chips. Todo clickeable; si permitirOtro, deja escribir
// un valor libre para los casos que no están en la lista.
export default function SelectChips({ opciones, valor, onChange, otro = false, placeholder = 'Otro…' }) {
  const enLista = opciones.includes(valor)
  const [modoOtro, setModoOtro] = useState(!!valor && !enLista)

  function elegir(o) {
    setModoOtro(false)
    onChange(valor === o ? '' : o)
  }
  function activarOtro() {
    if (modoOtro) {
      setModoOtro(false)
      onChange('')
    } else {
      setModoOtro(true)
      onChange('')
    }
  }

  return (
    <div className="chipsel-wrap">
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          className={'chipsel' + (!modoOtro && valor === o ? ' on' : '')}
          onClick={() => elegir(o)}
        >
          {o}
        </button>
      ))}
      {otro && (
        <button type="button" className={'chipsel' + (modoOtro ? ' on' : '')} onClick={activarOtro}>
          Otro
        </button>
      )}
      {otro && modoOtro && (
        <input
          className="chipsel-otro"
          value={enLista ? '' : valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
      )}
    </div>
  )
}
