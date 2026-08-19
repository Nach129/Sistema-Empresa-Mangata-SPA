-- Seguridad y actualización automática para HU-05 a HU-08.
create or replace function public.puede_gestionar_productos(usuario_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfil
    where id = usuario_id
      and rol in ('ADMINISTRADOR', 'TRABAJADOR')
  );
$$;

revoke all on function public.puede_gestionar_productos(uuid) from public;
grant execute on function public.puede_gestionar_productos(uuid) to authenticated;

create or replace function public.actualizar_fecha_producto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.actualizar_fecha_producto() from public;

create trigger trg_actualizar_fecha_producto
before update on public.producto
for each row execute function public.actualizar_fecha_producto();

create policy "producto_consultar_autenticado"
on public.producto for select
to authenticated
using (true);

create policy "producto_insertar_autorizado"
on public.producto for insert
to authenticated
with check (public.puede_gestionar_productos());

create policy "producto_actualizar_autorizado"
on public.producto for update
to authenticated
using (public.puede_gestionar_productos())
with check (public.puede_gestionar_productos());

revoke all privileges on table public.producto from anon, authenticated, service_role;
grant select on table public.producto to authenticated;
grant insert (nombre, descripcion, categoria, material, precio_base, imagen_url, activo)
on table public.producto to authenticated;
grant update (nombre, descripcion, categoria, material, precio_base, imagen_url, activo)
on table public.producto to authenticated;

revoke all privileges on sequence public.producto_id_seq from anon, authenticated, service_role;
grant usage on sequence public.producto_id_seq to authenticated;
