-- La Edge Function usa service_role exclusivamente para crear Auth + perfil.
-- RLS continúa activa y las claves privadas permanecen fuera del frontend.
grant select, insert on table public.perfil to service_role;
