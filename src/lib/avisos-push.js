// Política de "ofrecer los avisos push" en el momento de máxima intención (recién
// siguió un aviso). Vive acá, y no dentro del cartel, para que App pueda decidir
// ANTES de abrir la capa: si abriera y cerrara el modal al vuelo, el sistema del
// botón atrás empujaría y sacaría un centinela de historial y se comería un toque.
//
// Insistencia: máximo 3 veces y nunca dos veces el mismo día. El disparador es una
// acción intencional del usuario, así que no hace falta más freno que eso.
import { esStandalone, esIOS } from './instalar.js'
import { soportado, estadoPermiso, yaSuscripto } from './push.js'

const CLAVE = 'chicho_pedir_avisos' // { n: veces mostrado/descartado, t: ms de la última }
const MAX = 3
const HORAS = 20

function leer() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}
  } catch (e) {
    return {}
  }
}
function guardar(n) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ n, t: Date.now() }))
  } catch (e) {
    /* ignore */
  }
}

// Suma una aparición (o descarte). Cuando llega a MAX, no se ofrece más.
export function marcarOfrecido() {
  guardar((leer().n || 0) + 1)
}
// No volver a ofrecer nunca (ya los activó, o bloqueó el permiso: no se puede repreguntar).
export function marcarBasta() {
  guardar(MAX)
}

// ¿Hay algo que ofrecer? 'activar' (ya está instalada) | 'instalar' (paso previo) | null.
export async function decidirModo() {
  try {
    if (!soportado()) return null
    if (estadoPermiso() === 'denied') return null // el navegador no vuelve a preguntar
    const { n = 0, t = 0 } = leer()
    if (n >= MAX) return null
    if (t && Date.now() - t < HORAS * 3600000) return null
    if (await yaSuscripto()) return null // ya le llegan: nada que pedir
    // iPhone sin instalar: Apple exige "agregar a inicio" para que exista el push, así
    // que ahí el paso previo es real. En Android/escritorio no: el push anda en el
    // navegador solo, y pedir instalar primero era un peaje que casi nadie pagaba (de
    // 177 visitas de campaña, 5 instalaron). Se pide lo que de verdad importa.
    if (esIOS() && !esStandalone()) return 'instalar'
    return 'activar'
  } catch (e) {
    return null
  }
}
