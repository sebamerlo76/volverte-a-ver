// Comparación de huellas visuales. Es liviano (sin dependencias), así que se
// puede importar en cualquier componente sin arrastrar el modelo de ML.

// Piso de parecido: por debajo de esto no es coincidencia, aunque sobre lugar en la
// lista. Con pocos avisos en la zona, los últimos puestos se llenaban con cualquiera (un
// negro contra uno marrón). Calibrado para DINOv2 con el A/B de avisos reales (el mismo
// animal puntúa 0.40-0.83; con CLIP era 0.65). Ajustar mirando el log [parecidos].
//
// Va acá y no en similar.js —donde estaría más "a mano"— porque ese arrastra
// transformers.js (815 KB) y quien sólo necesita el número no tiene por qué bajarse el
// modelo entero. Lo usan el asistente de Encontré y el buscador del panel: los dos tienen
// que mover el mismo umbral, si no uno dice "es parecido" y el otro no.
export const SIM_PISO = 0.4

// Coseno entre dos huellas ya normalizadas (producto punto). 1 = idénticas.
export function similitud(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
