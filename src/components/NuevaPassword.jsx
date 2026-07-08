import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Pantalla para elegir una contraseña nueva. Se muestra cuando el usuario vuelve
// desde el enlace de "recuperar contraseña" del mail (evento PASSWORD_RECOVERY).
export default function NuevaPassword({ onListo, onToast }) {
  const [pass, setPass] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function guardar() {
    if (pass.length < 6) {
      onToast('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCargando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pass })
      if (error) throw error
      onToast('¡Listo! Ya podés usar tu nueva contraseña')
      onListo()
    } catch (e) {
      onToast(e.message || 'No se pudo cambiar la contraseña')
      setCargando(false)
    }
  }

  return (
    <div className="view" style={{ zIndex: 4700 }}>
      <div className="fhead">
        <div className="ftitle">Nueva contraseña</div>
      </div>

      <div className="body form-body">
        <div style={{ textAlign: 'center', margin: '10px 0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <img src="/logo.png" alt="" width="52" height="52" style={{ display: 'block' }} />
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 36, color: 'var(--navy)' }}>Chicho</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
            Elegí una contraseña nueva para tu cuenta.
          </div>
        </div>

        <div className="flabel" style={{ marginTop: 22 }}>Contraseña nueva</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
            lock
          </span>
          <input
            type={verPass ? 'text' : 'password'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === 'Enter' && guardar()}
          />
          <button
            type="button"
            className="inp-eye"
            onClick={() => setVerPass((v) => !v)}
            aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <span className="mi" style={{ fontSize: 21, color: 'var(--muted)' }}>
              {verPass ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      <div className="fsubmit">
        <button className="btn-pub" onClick={guardar} disabled={cargando}>
          <span className="mi" style={{ fontSize: 23 }}>
            check
          </span>
          {cargando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </div>
    </div>
  )
}
