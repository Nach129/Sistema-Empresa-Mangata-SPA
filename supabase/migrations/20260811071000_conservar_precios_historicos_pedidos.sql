-- Al editar, conserva el precio ya pactado para productos existentes; sólo los nuevos toman precio vigente.
create or replace function public.actualizar_pedido_completo(p_pedido_id bigint,p_fecha_entrega date,p_observaciones text,p_detalles jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_estado text;v_fecha date;v_total numeric(12,0);v_detalle jsonb;v_calculados jsonb;
begin
 if not public.puede_gestionar_pedidos() then raise exception 'NO_AUTORIZADO';end if;
 select estado,fecha_solicitud into v_estado,v_fecha from public.pedido where id=p_pedido_id for update;
 if not found then raise exception 'PEDIDO_NO_EXISTE';end if;
 if v_estado in('ENTREGADO','CANCELADO')then raise exception 'PEDIDO_FINAL';end if;
 if p_fecha_entrega is not null and p_fecha_entrega<v_fecha then raise exception 'FECHA_INVALIDA';end if;
 if p_detalles is null or jsonb_typeof(p_detalles)<>'array' or jsonb_array_length(p_detalles)=0 then raise exception 'DETALLES_REQUERIDOS';end if;
 if exists(select 1 from jsonb_array_elements(p_detalles)d group by(d->>'producto_id')having count(*)>1)then raise exception 'PRODUCTO_DUPLICADO';end if;
 if exists(select 1 from jsonb_array_elements(p_detalles)d left join public.producto p on p.id=(d->>'producto_id')::bigint where p.id is null or(d->>'cantidad')::integer<=0 or(not p.activo and not exists(select 1 from public.detalle_pedido x where x.pedido_id=p_pedido_id and x.producto_id=p.id)))then raise exception 'DETALLE_INVALIDO';end if;
 select jsonb_agg(jsonb_build_object('producto_id',p.id,'cantidad',(d->>'cantidad')::integer,'personalizacion',d->>'personalizacion','precio_unitario',coalesce(x.precio_unitario,p.precio_base)))into v_calculados from jsonb_array_elements(p_detalles)d join public.producto p on p.id=(d->>'producto_id')::bigint left join public.detalle_pedido x on x.pedido_id=p_pedido_id and x.producto_id=p.id;
 select sum((d->>'cantidad')::integer*(d->>'precio_unitario')::numeric)into v_total from jsonb_array_elements(v_calculados)d;
 delete from public.detalle_pedido where pedido_id=p_pedido_id;
 for v_detalle in select value from jsonb_array_elements(v_calculados)loop
  insert into public.detalle_pedido(pedido_id,producto_id,cantidad,precio_unitario,subtotal,personalizacion)values(p_pedido_id,(v_detalle->>'producto_id')::bigint,(v_detalle->>'cantidad')::integer,(v_detalle->>'precio_unitario')::numeric,(v_detalle->>'cantidad')::integer*(v_detalle->>'precio_unitario')::numeric,nullif(btrim(v_detalle->>'personalizacion'),''));
 end loop;
 update public.pedido set fecha_entrega=p_fecha_entrega,observaciones=nullif(btrim(p_observaciones),''),total=v_total,updated_at=now()where id=p_pedido_id;
end;$$;
revoke all on function public.actualizar_pedido_completo(bigint,date,text,jsonb)from public;
grant execute on function public.actualizar_pedido_completo(bigint,date,text,jsonb)to authenticated;
