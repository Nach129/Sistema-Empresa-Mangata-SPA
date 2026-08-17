-- Gestión administrativa de usuarios con mínimo privilegio.

drop policy if exists "operador_pedidos_consultar_perfiles" on public.perfil;
drop policy if exists "administrador_consultar_perfiles" on public.perfil;

create policy "administrador_consultar_perfiles"
on public.perfil for select
to authenticated
using (public.es_administrador());

-- Los trabajadores solo requieren perfiles CLIENTE para operar Pedidos.
create policy "operador_pedidos_consultar_clientes"
on public.perfil for select
to authenticated
using (public.puede_consultar_pedidos() and rol = 'CLIENTE');

create or replace function public.proteger_ultimo_administrador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol = 'ADMINISTRADOR'
     and (tg_op = 'DELETE' or new.rol <> 'ADMINISTRADOR')
     and not exists (
       select 1 from public.perfil
       where rol = 'ADMINISTRADOR' and id <> old.id
     ) then
    raise exception 'ULTIMO_ADMINISTRADOR';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.proteger_ultimo_administrador() from public;

create trigger trg_proteger_ultimo_administrador
before update of rol or delete on public.perfil
for each row execute function public.proteger_ultimo_administrador();

grant update (nombre, apellido, rut, correo, telefono, rol, updated_at)
on table public.perfil to service_role;
grant select on table public.pedido, public.historial_pedido to service_role;
