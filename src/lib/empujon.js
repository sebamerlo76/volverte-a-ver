// Orden de "Perdidos que necesitan empujón" en el panel del admin.
//
// Sebastián sube esos avisos a las historias de Instagram y necesita recorrerlos de
// arriba hacia abajo sin repetir ninguno ni saltearse otros. El orden es:
//   1. Los que NUNCA se difundieron, el que lleva más tiempo perdido arriba.
//   2. Los ya difundidos, el que hace más que no se toca arriba.
//
// Vive acá y no dentro del componente para poder probarlo sin sesión de admin
// (test/orden-empujon.test.mjs): es el tipo de lógica donde un signo al revés no se
// nota —la lista igual se ve ordenada— pero te hace empezar por los que ya subiste.
export function ordenarEmpujon(lista) {
  if (!lista) return []
  return [...lista].sort((a, b) => {
    const da = a.difusiones || 0
    const db = b.difusiones || 0
    if (!da !== !db) return da ? 1 : -1 // uno difundido y el otro no: el virgen arriba
    if (da && db) return (a.difundidoEn || '') < (b.difundidoEn || '') ? -1 : 1
    return (a.creadoEn || '') < (b.creadoEn || '') ? -1 : 1 // el que lleva más tiempo perdido
  })
}
