-- Endurecimiento de seguridad (warnings del Security Advisor de Supabase).

-- 1) Fijar search_path en las funciones SECURITY DEFINER (evita "search_path mutable").
--    public, pg_temp mantiene todo funcionando y deja el path inmutable.
alter function public.perfil_publico(uuid) set search_path = public, pg_temp;
alter function public.disparar_notificar() set search_path = public, pg_temp;

-- 2) La función del trigger no necesita ser ejecutable directamente por usuarios
--    (los triggers la ejecutan igual). Sacamos el EXECUTE público.
revoke execute on function public.disparar_notificar() from public, anon, authenticated;
