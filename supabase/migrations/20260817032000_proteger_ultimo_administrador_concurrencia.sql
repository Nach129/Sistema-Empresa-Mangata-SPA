create or replace function public.proteger_ultimo_administrador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol = 'ADMINISTRADOR'
     and (tg_op = 'DELETE' or new.rol <> 'ADMINISTRADOR') then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('public.perfil.ultimo_administrador', 0)
    );

    if not exists (
      select 1
      from public.perfil
      where rol = 'ADMINISTRADOR' and id <> old.id
    ) then
      raise exception 'ULTIMO_ADMINISTRADOR';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.proteger_ultimo_administrador() from public;

comment on function public.proteger_ultimo_administrador() is
  'Impide eliminar o degradar al último administrador, incluso ante operaciones concurrentes.';
