// Confirmación propia de Chicho (reemplaza window.confirm, que muestra el
// dominio "…vercel.app dice"). API imperativa que devuelve una promesa:
//
//   if (await confirmar('¿Borrar el aviso?')) { ... }
//   confirmar({ mensaje: '…', aceptar: 'Borrar', peligro: true }).then((ok) => ...)
//
// El <ConfirmHost /> montado en main.jsx escucha y renderiza el cartel.

let abrir = null

// Lo llama ConfirmHost al montarse.
export function _registrarConfirm(fn) {
  abrir = fn
}

export function confirmar(opts) {
  const o = typeof opts === 'string' ? { mensaje: opts } : opts || {}
  return new Promise((resolve) => {
    if (!abrir) {
      // Fallback por si el host todavía no montó: no bloquea la app.
      resolve(typeof window !== 'undefined' ? window.confirm(o.mensaje || '¿Confirmás?') : false)
      return
    }
    abrir({ ...o, resolve })
  })
}
