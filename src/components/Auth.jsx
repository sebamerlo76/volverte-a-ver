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

  async function conGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
      // El navegador se redirige a Google; al volver, la sesión queda iniciada.
    } catch (e) {
      onToast(traducirError(e.message))
    }
  }

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
            {esRegistro ? 'Sumate a Chicho' : '¡Hola de nuevo!'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 700, marginTop: 4, lineHeight: 1.5 }}>
            {esRegistro
              ? 'Creá tu cuenta para publicar y gestionar tus avisos.'
              : 'Ingresá para publicar y gestionar tus avisos.'}
          </div>
        </div>

        <button className="btn-social" onClick={conGoogle} style={{ marginTop: 22 }}>
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="divider">
          <span>o con tu email</span>
        </div>

        <div className="flabel">Email</div>
        <div className="inp">
          <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
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
          <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
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
