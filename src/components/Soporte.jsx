// Hoja de soporte: WhatsApp (principal) + email. Se abre desde el menú "Ayuda".
const WA = 'https://wa.me/5493434054998?text=' + encodeURIComponent('Hola, necesito ayuda con Chicho 🐾')
const MAIL = 'mailto:sebamerlo76@gmail.com?subject=' + encodeURIComponent('Ayuda con Chicho')

export default function Soporte({ onCerrar }) {
  return (
    <div className="pp-sheet-ov" onClick={onCerrar}>
      <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="report-sheet-t">¿Necesitás ayuda o querés avisarnos algo?</div>
        <a className="pp-op" href={WA} target="_blank" rel="noreferrer" onClick={onCerrar}>
          <span className="mi" style={{ fontSize: 23, color: '#25D366' }}>
            chat
          </span>
          Escribinos por WhatsApp
        </a>
        <a className="pp-op" href={MAIL} onClick={onCerrar}>
          <span className="mi" style={{ fontSize: 23, color: 'var(--navy)' }}>
            mail
          </span>
          Escribinos por email
        </a>
        <button className="pp-cancel" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
