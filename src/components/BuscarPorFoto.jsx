import { useEffect, useRef, useState } from 'react'
import { getReportes, getEmbeddingsDe } from '../data/store.js'
import { similitud, SIM_PISO } from '../lib/vector.js'
import { nombreMostrado, tiempoRelativo } from '../lib/formato.js'
import { ubicacionTexto } from '../lib/localidades.js'
import { fotoOptimizada } from '../lib/foto.js'

// Buscador por foto del panel (sólo admin).
//
// Para qué: en los grupos de Facebook aparecen mascotas encontradas que ya están
// publicadas como perdidas en Chicho, y hoy eso se detecta sólo si alguien se acuerda de
// las dos publicaciones. Acá se bajan esas fotos, se sueltan en el panel y el buscador
// dice si alguna se parece a un aviso.
//
// NADA SE GUARDA. Las fotos no se suben a ningún lado: se leen del disco a un blob local,
// el modelo las analiza en este mismo navegador y al salir se descartan (los blobs se
// revocan). Lo único que viaja a Supabase es la LECTURA de las huellas de los avisos, que
// es lo mismo que ya hace el asistente de Encontré para cualquier usuario.
//
// Es una herramienta de admin a propósito: la idea a futuro es que esto lo hagan los
// propios usuarios, pero primero hay que ver cuánto acierta con fotos de grupos, que
// vienen mucho peores que las que se suben acá (capturas de pantalla, recortes, marcas).
const MAX_FOTOS = 12
const TOP = 4 // coincidencias que se muestran por foto

export default function BuscarPorFoto({ onOpen, onToast }) {
  const [estado, setEstado] = useState('') // '' | 'cargando' | 'listo' | 'error'
  const [candidatos, setCandidatos] = useState([]) // avisos con huella, para comparar
  const [soloPerdidos, setSoloPerdidos] = useState(true)
  const [items, setItems] = useState([]) // { id, url, nombre, estado, matches }
  const [progreso, setProgreso] = useState('')
  const inputRef = useRef(null)
  const urlsRef = useRef([]) // blobs a revocar

  // Al desmontar, soltar las fotos de memoria. Nunca salieron del navegador, pero
  // tampoco tienen por qué quedar colgando.
  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
      urlsRef.current = []
    },
    [],
  )

  // Trae los avisos activos y sus huellas. Se hace una vez, al primer uso, y no al abrir
  // el panel: son varias consultas y la mayoría de las veces esta sección ni se toca.
  async function cargarCandidatos() {
    if (candidatos.length) return candidatos
    setEstado('cargando')
    setProgreso('Buscando los avisos publicados…')
    const todos = await getReportes()
    const activos = (todos || []).filter((r) => r.estado === 'activo' && r.foto)
    const emb = await getEmbeddingsDe(activos.map((r) => r.id))
    const conHuella = activos
      .map((r) => ({ ...r, huella: emb[r.id] }))
      .filter((r) => Array.isArray(r.huella) && r.huella.length)
    setCandidatos(conHuella)
    setEstado('listo')
    if (!conHuella.length) onToast?.('Ningún aviso tiene huella visual todavía')
    return conHuella
  }

  async function elegirFotos(e) {
    const files = [...(e.target.files || [])].slice(0, MAX_FOTOS)
    if (!files.length) return
    e.target.value = '' // permite volver a elegir la misma foto

    let base
    try {
      base = await cargarCandidatos()
    } catch (err) {
      console.error('candidatos', err)
      setEstado('error')
      onToast?.('No se pudieron traer los avisos')
      return
    }
    if (!base.length) return

    // Se pintan primero en gris y se van resolviendo de a una: con varias fotos el
    // análisis tarda, y ver la lista llenarse dice más que un spinner solo.
    const nuevos = files.map((f, i) => {
      const url = URL.createObjectURL(f)
      urlsRef.current.push(url)
      return { id: `${Date.now()}-${i}`, url, nombre: f.name, estado: 'pendiente', matches: [] }
    })
    setItems((prev) => [...nuevos, ...prev])

    const { huellaDeImagen } = await import('../lib/similar.js')
    for (let i = 0; i < nuevos.length; i++) {
      const it = nuevos[i]
      setProgreso(`Analizando foto ${i + 1} de ${nuevos.length}…`)
      try {
        const h = await huellaDeImagen(it.url)
        const pool = soloPerdidos ? base.filter((r) => r.tipo === 'perdido') : base
        const matches = pool
          .filter((r) => r.huella.length === h.length)
          .map((r) => ({ r, s: similitud(h, r.huella) }))
          .sort((a, b) => b.s - a.s)
          .filter((o) => o.s >= SIM_PISO)
          .slice(0, TOP)
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, estado: 'ok', matches } : x)))
      } catch (err) {
        console.error('huella', err)
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, estado: 'error' } : x)))
      }
    }
    setProgreso('')
  }

  function limpiar() {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    urlsRef.current = []
    setItems([])
    setProgreso('')
  }

  const conCoincidencia = items.filter((i) => i.matches.length).length

  return (
    <div className="bpf">
      <div className="adm-nota" style={{ marginTop: 0 }}>
        Soltá fotos de mascotas que viste en grupos y te digo si se parecen a un aviso de Chicho. <b>No se guarda nada</b>: las
        fotos se analizan en este teléfono y no se suben a ningún lado.
      </div>

      <div className="bpf-chips">
        <button type="button" className={'chip' + (soloPerdidos ? ' on' : '')} onClick={() => setSoloPerdidos(true)}>
          Buscar entre los perdidos
        </button>
        <button type="button" className={'chip' + (!soloPerdidos ? ' on' : '')} onClick={() => setSoloPerdidos(false)}>
          Entre todos los avisos
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple onChange={elegirFotos} style={{ display: 'none' }} />
      <div className="bpf-acc">
        <button className="adm-btn" onClick={() => inputRef.current?.click()} disabled={estado === 'cargando' || !!progreso}>
          <span className="mi" style={{ fontSize: 18 }}>
            add_photo_alternate
          </span>
          Elegir fotos
        </button>
        {items.length > 0 && (
          <button className="adm-btn ghost" onClick={limpiar} disabled={!!progreso}>
            Limpiar
          </button>
        )}
      </div>

      {progreso && <div className="adm-nota">{progreso} · la primera vez baja el modelo (~24 MB), después es instantáneo.</div>}
      {estado === 'listo' && !progreso && candidatos.length > 0 && (
        <div className="adm-nota">
          Comparando contra <b>{soloPerdidos ? candidatos.filter((r) => r.tipo === 'perdido').length : candidatos.length}</b> avisos con
          huella visual.
        </div>
      )}

      {items.length > 0 && (
        <div className="adm-nota">
          {conCoincidencia > 0 ? (
            <>
              🎯 <b>{conCoincidencia}</b> de {items.length} {items.length === 1 ? 'foto tiene' : 'fotos tienen'} alguna coincidencia.
            </>
          ) : (
            <>Ninguna de las {items.length} coincide con un aviso.</>
          )}
        </div>
      )}

      <div className="bpf-lista">
        {items.map((it) => (
          <div key={it.id} className={'bpf-item' + (it.matches.length ? ' hay' : '')}>
            <img className="bpf-foto" src={it.url} alt="" />
            <div className="bpf-res">
              {it.estado === 'pendiente' && <div className="bpf-vacio">Analizando…</div>}
              {it.estado === 'error' && <div className="bpf-vacio">No se pudo leer esta foto</div>}
              {it.estado === 'ok' && it.matches.length === 0 && <div className="bpf-vacio">Sin coincidencias</div>}
              {it.matches.map(({ r, s }) => (
                <button key={r.id} className="bpf-match" onClick={() => onOpen?.(r)}>
                  <img src={fotoOptimizada(r.foto, 200)} alt="" />
                  <div className="bpf-match-txt">
                    <div className="bpf-match-t">{nombreMostrado(r)}</div>
                    <div className="bpf-match-s">
                      {ubicacionTexto(r.localidad, r.zona)} · {tiempoRelativo(r.creadoEn)}
                    </div>
                  </div>
                  {/* El puntaje va a la vista porque esto es el panel: sirve para calibrar
                      el piso con casos reales. En la app del usuario se sacó a propósito. */}
                  <span className="bpf-score">{s.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
