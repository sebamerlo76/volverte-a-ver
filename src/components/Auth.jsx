import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Traduce los errores más comunes de Supabase Auth a algo entendible.
function traducirError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.'
  if (m.includes('already registered')) return 'Ese email ya tiene cuenta. Probá iniciar sesión.'
  if (m.includes('at least 6')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('not confirmed')) return 'Falta confirmar el email. Revisá tu correo.'
  if (m.includes('unable to validate email')) return 'Ese email no parece válido.'
  return msg || 'Ocurrió un error. Probá de nuevo.'
}

export default function Auth({ onCerrar, onAuth, onToast }) {
  const [modo, setModo] = useState('ingresar') // ingresar | registrar
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [cargando, setCargando] = useState(false)

  const esRegistro = modo === 'registrar'

  async function enviar() {
    if (!email.trim() || !pass) {
      onToast('Completá email y contraseña')
      return
    }
    setCargando(true)
    try {
      const creds = { email: email.trim(), password: pass }
      const { error } = esRegistro
        ? await supabase.auth.signUp(creds)
        : await supabase.auth.signInWithPassword(creds)
      if (error) throw error
      onAuth()
    } catch (e) {
      onToast(traducirError(e.message))
      setCargando(false)
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          close
        </button>
        <div className="ftitle">{esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}</div>
      </div>

      <div className="body form-body">
        <div
          style={{
            textAlign: 'center',
            margin: '10px 0 4px',
          }}
        >
          <div
            className="logo"
            style={{ width: 56, height: 56, borderRadius: 18, margin: '0 auto', fontSize: 30 }}
          >
            <span className="mi fill" style={{ fontSize: 30 }}>
              pets
            </span>
          </div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 22, marginTop: 12 }}>
            {esRegistro ? 'Sumate a Volverte a ver' : '¡Hola de nuevo!'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 700, marginTop: 4, lineHeight: 1.5 }}>
            {esRegistro
              ? 'Creá tu cuenta para publicar y gestionar tus avisos.'
              : 'Ingresá para publicar y gestionar tus avisos.'}
          </div>
        </div>

        <div className="flabel">Email</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
            mail
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <div className="flabel">Contraseña</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
            lock
          </span>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
          />
        </div>

        <div
          style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, fontWeight: 700, color: 'var(--muted)' }}
        >
          {esRegistro ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
          <button
            onClick={() => setModo(esRegistro ? 'ingresar' : 'registrar')}
            style={{ color: 'var(--coral)', fontWeight: 800, fontSize: 13.5 }}
          >
            {esRegistro ? 'Iniciar sesión' : 'Crear una'}
          </button>
        </div>
        <div style={{ height: 24 }} />
      </div>

      <div className="fsubmit">
        <button className="btn-pub" onClick={enviar} disabled={cargando}>
          <span className="mi" style={{ fontSize: 23 }}>
            {esRegistro ? 'person_add' : 'login'}
          </span>
          {cargando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}
