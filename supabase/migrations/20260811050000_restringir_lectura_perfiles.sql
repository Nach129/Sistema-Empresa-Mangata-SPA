-- HU-02 no requiere que el frontend administrativo lea perfiles ajenos.
-- La comprobación del rol usa únicamente el perfil propio y la Edge Function
-- conserva SELECT con service_role para validar duplicados.
drop policy if exists "administrador_consultar_perfiles" on public.perfil;
