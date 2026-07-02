import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Muestra el QR de una mascota para imprimir y poner en el collar.
export default function ChapitaQR({ mascota, onCerrar, onToast }) {
  const [dataUrl, setDataUrl] = useState('')
  const url = `${window.location.origin}/m/${mascota.id}`
  const nombre = mascota.nombre || 'tu mascota'

  useEffect(() => {
    QRCode.toDataURL(url, { width: 520, margin: 2, color: { dark: '#2a2320', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(''))
  }, [url])

  function descargar() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `QR-${(mascota.nombre || 'mascota').replace(/\s+/g, '-')}.png`
    a.click()
  }

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Chapita QR de ${nombre}`, text: `Perfil de ${nombre} en Volverte a ver`, url })
      } catch (e) {
        /* cancelado */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        onToast && onToast('🔗 Link copiado')
      } catch (e) {
        onToast && onToast(url)
      }
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          arrow_back
        </button>
        <div className="ftitle">Chapita QR</div>
      </div>

      <div className="body form-body" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', margin: '8px 0 4px', lineHeight: 1.5 }}>
          Imprimí este QR y ponelo en el collar de <b>{nombre}</b>. Quien lo escanee va a ver su perfil y podrá
          avisarte por WhatsApp. 🐾
        </div>

        <div className="qr-box">
          {dataUrl ? <img src={dataUrl} alt="Código QR" /> : <div className="empty">Generando…</div>}
          <div className="qr-pie">
            <span className="mi fill" style={{ fontSize: 16, color: '#ff6b5e' }}>
              pets
            </span>
            {nombre} · Volverte a ver
          </div>
        </div>

        <div className="qr-url">{url}</div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn-pub" style={{ flex: 1 }} onClick={descargar}>
            <span className="mi" style={{ fontSize: 22 }}>
              download
            </span>
            Descargar
          </button>
          <button className="btn-share" style={{ flex: 'none' }} onClick={compartir}>
            <span className="mi" style={{ fontSize: 22 }}>
              ios_share
            </span>
          </button>
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--faint)', marginTop: 16, lineHeight: 1.5 }}>
          Tip: cargá el <b>WhatsApp</b> en el perfil de la mascota para que el QR pueda avisarte.
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
