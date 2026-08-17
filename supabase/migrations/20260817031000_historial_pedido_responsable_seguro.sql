create or replace function public.obtener_historial_pedido(p_pedido_id bigint)
returns table (
  id bigint,
  estado_anterior text,
  estado_nuevo text,
  observacion text,
  created_at timestamptz,
  responsable_nombre text,
  responsable_apellido text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.pedido p
    where p.id = p_pedido_id
      and (public.puede_consultar_pedidos() or p.cliente_id = auth.uid())
  ) then
    raise exception 'NO_AUTORIZADO';
  end if;

  return query
  select
    h.id,
    h.estado_anterior,
    h.estado_nuevo,
    h.observacion,
    h.created_at,
    u.nombre,
    u.apellido
  from public.historial_pedido h
  left join public.perfil u on u.id = h.usuario_id
  where h.pedido_id = p_pedido_id
  order by h.created_at desc;
end;
$$;

revoke all on function public.obtener_historial_pedido(bigint) from public, anon;
grant execute on function public.obtener_historial_pedido(bigint) to authenticated;

comment on function public.obtener_historial_pedido(bigint) is
  'Entrega el historial autorizado con el nombre mínimo del responsable sin exponer el listado completo de perfiles.';
