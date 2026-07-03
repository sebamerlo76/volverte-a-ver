// Comparación de huellas visuales. Es liviano (sin dependencias), así que se
// puede importar en cualquier componente sin arrastrar el modelo de ML.
// Coseno entre dos huellas ya normalizadas (producto punto). 1 = idénticas.
export function similitud(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
