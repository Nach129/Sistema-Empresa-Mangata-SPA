-- Métricas agregadas para HU-16 a HU-20. No expone información personal.
create or replace function public.obtener_reporte_general(
  p_desde date default null,
  p_hasta date default null,
  p_estado varchar default null,
  p_producto_id bigint default null
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare resultado jsonb;
begin
  if not public.puede_consultar_pedidos() then raise exception 'NO_AUTORIZADO'; end if;
  if p_desde is not null and p_hasta is not null and p_desde > p_hasta then raise exception 'RANGO_INVALIDO'; end if;
  if p_estado is not null and p_estado not in ('RECIBIDO','EN_REVISION','EN_PRODUCCION','LISTO','ENTREGADO','CANCELADO') then raise exception 'ESTADO_INVALIDO'; end if;
  if p_producto_id is not null and not exists(select 1 from public.producto where id=p_producto_id) then raise exception 'PRODUCTO_INVALIDO'; end if;

  with filtrados as (
    select p.* from public.pedido p
    where (p_desde is null or p.fecha_solicitud>=p_desde)
      and (p_hasta is null or p.fecha_solicitud<=p_hasta)
      and (p_estado is null or p.estado=p_estado)
      and (p_producto_id is null or exists(select 1 from public.detalle_pedido d where d.pedido_id=p.id and d.producto_id=p_producto_id))
  ), estados(estado,orden) as (values ('RECIBIDO',1),('EN_REVISION',2),('EN_PRODUCCION',3),('LISTO',4),('ENTREGADO',5),('CANCELADO',6)),
  por_estado as (select e.estado,e.orden,count(f.id) cantidad from estados e left join filtrados f on f.estado=e.estado group by e.estado,e.orden),
  productos as (
    select pr.id,pr.nombre,sum(d.cantidad)::bigint cantidad
    from filtrados f join public.detalle_pedido d on d.pedido_id=f.id join public.producto pr on pr.id=d.producto_id
    where f.estado<>'CANCELADO' and (p_producto_id is null or pr.id=p_producto_id)
    group by pr.id,pr.nombre order by cantidad desc,pr.nombre limit 10
  ),
  ventas_mes as (
    select to_char(date_trunc('month',fecha_solicitud),'YYYY-MM') periodo,sum(total)::numeric total
    from filtrados where estado<>'CANCELADO' group by date_trunc('month',fecha_solicitud) order by date_trunc('month',fecha_solicitud)
  ),
  lista_productos as (select id,nombre,activo from public.producto order by nombre)
  select jsonb_build_object(
    'indicadores',jsonb_build_object(
      'total_pedidos',(select count(*) from filtrados),
      'pedidos_pendientes',(select count(*) from filtrados where estado in('RECIBIDO','EN_REVISION','EN_PRODUCCION','LISTO')),
      'pedidos_entregados',(select count(*) from filtrados where estado='ENTREGADO'),
      'total_ventas',(select coalesce(sum(total),0) from filtrados where estado<>'CANCELADO')
    ),
    'pedidos_por_estado',(select coalesce(jsonb_agg(jsonb_build_object('estado',estado,'cantidad',cantidad)order by orden),'[]'::jsonb)from por_estado),
    'productos_mas_solicitados',(select coalesce(jsonb_agg(jsonb_build_object('producto_id',id,'nombre',nombre,'cantidad',cantidad)order by cantidad desc,nombre),'[]'::jsonb)from productos),
    'ventas_por_mes',(select coalesce(jsonb_agg(jsonb_build_object('periodo',periodo,'total',total)order by periodo),'[]'::jsonb)from ventas_mes),
    'productos_filtro',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'nombre',nombre,'activo',activo)order by nombre),'[]'::jsonb)from lista_productos)
  ) into resultado;
  return resultado;
end;$$;
revoke all on function public.obtener_reporte_general(date,date,varchar,bigint) from public,anon;
grant execute on function public.obtener_reporte_general(date,date,varchar,bigint) to authenticated;
