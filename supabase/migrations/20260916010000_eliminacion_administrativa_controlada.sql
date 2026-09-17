-- Eliminación física explícita y restringida para pedidos y productos.

create or replace function public.eliminar_pedido_administrativo(p_pedido_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.es_administrador(auth.uid()) then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_pedido_id is null or p_pedido_id <= 0 then
    raise exception 'PEDIDO_NO_EXISTE';
  end if;

  perform 1
  from public.pedido
  where id = p_pedido_id
  for update;

  if not found then
    raise exception 'PEDIDO_NO_EXISTE';
  end if;

  delete from public.historial_pedido where pedido_id = p_pedido_id;
  delete from public.detalle_pedido where pedido_id = p_pedido_id;
  delete from public.pedido where id = p_pedido_id;
end;
$$;

create or replace function public.eliminar_producto_administrativo(p_producto_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.es_administrador(auth.uid()) then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_producto_id is null or p_producto_id <= 0 then
    raise exception 'PRODUCTO_NO_EXISTE';
  end if;

  perform 1
  from public.producto
  where id = p_producto_id
  for update;

  if not found then
    raise exception 'PRODUCTO_NO_EXISTE';
  end if;

  if exists (
    select 1
    from public.detalle_pedido
    where producto_id = p_producto_id
  ) then
    raise exception 'PRODUCTO_CON_PEDIDOS';
  end if;

  delete from public.producto where id = p_producto_id;
end;
$$;

revoke all on function public.eliminar_pedido_administrativo(bigint) from public, anon, authenticated;
revoke all on function public.eliminar_producto_administrativo(bigint) from public, anon, authenticated;

grant execute on function public.eliminar_pedido_administrativo(bigint) to authenticated;
grant execute on function public.eliminar_producto_administrativo(bigint) to authenticated;
