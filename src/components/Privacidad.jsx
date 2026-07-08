// Política de privacidad (chicho.ar/privacidad). URL requerida por Google Play.
export default function Privacidad() {
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
              Política de privacidad
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
              Última actualización: 8 de julio de 2026
            </div>

            <p style={{ ...p, marginTop: 18 }}>
              Chicho es una aplicación gratuita para ayudar a reunir mascotas perdidas con sus familias en Paraná y
              alrededores. Cuidamos tus datos y solo usamos lo mínimo necesario para que la app funcione.
            </p>

            <div style={h}>Qué datos recopilamos</div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={li}><b>Tu cuenta:</b> el email (y el nombre, si entrás con Google) para poder ingresar y gestionar tus avisos.</li>
              <li style={li}><b>Tus avisos:</b> las fotos, la descripción, la zona/ubicación aproximada y el WhatsApp de contacto que vos elegís cargar.</li>
              <li style={li}><b>Notificaciones:</b> si las activás, guardamos un identificador de tu dispositivo para poder enviarte avisos push.</li>
              <li style={li}><b>Uso general:</b> estadísticas anónimas de visitas (sin identificarte) para saber cómo se usa la app.</li>
            </ul>

            <div style={h}>Para qué los usamos</div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={li}>Mostrar los avisos de mascotas perdidas y encontradas.</li>
              <li style={li}>Avisarte cuando aparece una posible coincidencia o un aviso cerca tuyo.</li>
              <li style={li}>Permitir que las personas se contacten entre sí para reunir a la mascota con su familia.</li>
            </ul>

            <div style={h}>Qué NO hacemos</div>
            <p style={p}>No vendemos ni alquilamos tus datos. No mostramos publicidad de terceros. Tu email y tu contacto no se comparten con nadie más allá de lo que vos publicás en un aviso.</p>

            <div style={h}>Con quién compartimos datos (proveedores)</div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={li}><b>Supabase:</b> guarda la base de datos y las cuentas de forma segura.</li>
              <li style={li}><b>Vercel:</b> aloja la app y provee estadísticas anónimas de visitas.</li>
              <li style={li}><b>OpenStreetMap:</b> muestra los mapas.</li>
            </ul>

            <div style={h}>Tus derechos</div>
            <p style={p}>Podés editar o borrar tus avisos en cualquier momento desde la app. Podés pedir que borremos tu cuenta y todos tus datos escribiéndonos. Los avisos publicados sin cuenta se pueden cerrar o borrar desde el enlace privado que recibís al publicarlos.</p>

            <div style={h}>Menores de edad</div>
            <p style={p}>Chicho no está dirigida a menores de 13 años y no recopilamos datos de ellos a sabiendas.</p>

            <div style={h}>Contacto</div>
            <p style={p}>
              Por dudas o para borrar tu cuenta, escribinos a{' '}
              <a href="mailto:sebamerlo76@gmail.com" style={{ color: 'var(--coral)', fontWeight: 800 }}>sebamerlo76@gmail.com</a>{' '}
              o por WhatsApp al{' '}
              <a href="https://wa.me/5493434054998" target="_blank" rel="noreferrer" style={{ color: 'var(--coral)', fontWeight: 800 }}>+54 9 343 405-4998</a>.
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
