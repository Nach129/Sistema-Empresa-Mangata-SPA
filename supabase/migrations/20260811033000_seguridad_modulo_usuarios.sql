-- Seguridad del módulo Usuarios (HU-01 a HU-04).

create or replace function public.es_administrador(usuario_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfil
    where id = usuario_id and rol = 'ADMINISTRADOR'
  );
$$;

revoke all on function public.es_administrador(uuid) from public;
grant execute on function public.es_administrador(uuid) to authenticated, service_role;

create policy "perfil_consultar_propio"
on public.perfil for select
to authenticated
using (id = auth.uid());

create policy "administrador_consultar_perfiles"
on public.perfil for select
to authenticated
using (public.es_administrador());

create policy "perfil_actualizar_propio"
on public.perfil for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.proteger_actualizacion_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() = old.id then
    if new.id is distinct from old.id
       or new.rol is distinct from old.rol
       or new.created_at is distinct from old.created_at then
      raise exception 'No está permitido modificar los campos protegidos del perfil.';
    end if;
  elsif not public.es_administrador() and auth.role() <> 'service_role' then
    raise exception 'No tiene permisos para actualizar este perfil.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.proteger_actualizacion_perfil() from public;

create trigger trg_proteger_actualizacion_perfil
before update on public.perfil
for each row execute function public.proteger_actualizacion_perfil();

grant select, update on table public.perfil to authenticated;
