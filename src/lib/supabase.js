import { createClient } from '@supabase/supabase-js'

// Las claves se leen de variables de entorno (archivo .env, ver .env.example).
// Si NO están cargadas, la app funciona en "modo local" (localStorage) sin romperse.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase = supabaseConfigurado ? createClient(url, anonKey) : null

if (!supabaseConfigurado) {
  console.info('[Chicho] Supabase no configurado — usando almacenamiento local del navegador.')
}
