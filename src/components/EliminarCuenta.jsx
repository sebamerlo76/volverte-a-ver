// Página de solicitud de eliminación de cuenta (chicho.ar/eliminar-cuenta).
// URL requerida por Google Play (formulario de Seguridad de los datos).
export default function EliminarCuenta() {
  const h = { fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17, color: 'var(--navy)', margin: '22px 0 6px' }
  const p = { fontSize: 14, lineHeight: 1.65, color: 'var(--ink)', margin: '0 0 8px' }
  const li = { fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', margin: '0 0 5px' }
  return (
    <div className="app-shell">
      <div className="app pub">
        <div className="pub-scroll">
          <div className="pub-top">
            <a href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, textDecoration: 'none' }}>
              <img src="/logo.png" alt="" width="44" height="44" style={{ display: 'block' }} />
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 28, color: 'var(--navy)' }}>Chicho</span>
            </a>
          </div>

          <div className="pub-body" style={{ paddingTop: 4, paddingBottom: 40 }}>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 22, color: 'var(--navy)', textAlign: 'center' }}>
              Eliminar tu cuenta
            </div>

            <p style={{ ...p, marginTop: 18 }}>
              Podés pedir que eliminemos tu cuenta de Chicho y todos los datos asociados. El pedido es gratuito y lo
              procesamos en un plazo de hasta 30 días.
            </p>

            <div style={h}>Cómo pedir la eliminación</div>
            <p style={p}>
              Escribinos <b>desde el email de tu cuenta</b> con el asunto <b>“Eliminar cuenta”</b>:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={li}>
                Por email: <a href="mailto:sebamerlo76@gmail.com?subject=Eliminar%20cuenta" style={{ color: 'var(--coral)', fontWeight: 800 }}>sebamerlo76@gmail.com</a>
              </li>
              <li style={li}>
                Por WhatsApp: <a href="https://wa.me/5493434054998" target="_blank" rel="noreferrer" style={{ color: 'var(--coral)', fontWeight: 800 }}>+54 9 343 405-4998</a>
              </li>
            </ul>

            <div style={h}>Qué se elimina</div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={li}>Tu cuenta y tu email.</li>
              <li style={li}>Tus avisos publicados (fotos, descripciones y ubicaciones).</li>
              <li style={li}>Tus preferencias y suscripciones a notificaciones.</li>
            </ul>
            <p style={{ ...p, marginTop: 8 }}>
              Se elimina de forma permanente y no se puede recuperar. No conservamos datos personales tuyos después
              de procesar el pedido.
            </p>

            <div style={h}>Otra opción</div>
            <p style={p}>
              Si tenés la app abierta, también podés <b>desactivar tu cuenta</b> desde <b>Mi cuenta</b>, y editar o
              borrar cada aviso por tu cuenta en cualquier momento.
            </p>

            <div style={{ textAlign: 'center', marginTop: 26 }}>
              <a href="/" style={{ color: 'var(--coral)', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>← Volver a Chicho</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
