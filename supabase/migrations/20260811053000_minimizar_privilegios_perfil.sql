-- El esquema inicial heredó privilegios DDL innecesarios para los roles API.
-- Se reemplazan por los permisos mínimos utilizados por HU-01 a HU-04.
revoke all privileges on table public.perfil from anon, authenticated, service_role;

grant select on table public.perfil to authenticated;
grant update (nombre, apellido, rut, correo, telefono)
on table public.perfil to authenticated;

grant select on table public.perfil to service_role;
grant insert (id, nombre, apellido, rut, correo, telefono, rol)
on table public.perfil to service_role;
