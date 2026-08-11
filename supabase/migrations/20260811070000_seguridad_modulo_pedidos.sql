-- Implementación transaccional y de mínimo privilegio para HU-09 a HU-15.
create sequence if not exists public.numero_pedido_seq;

create or replace function public.puede_gestionar_pedidos(usuario_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfil where id = usuario_id and rol in ('ADMINISTRADOR', 'TRABAJADOR'));
$$;

create or replace function public.crear_pedido_completo(
  p_cliente_id uuid, p_fecha_entrega date, p_observaciones text, p_detalles jsonb
) returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_numero text; v_total numeric(12,0); v_detalle jsonb;
begin
  if not public.puede_gestionar_pedidos() then raise exception 'NO_AUTORIZADO'; end if;
  if not exists(select 1 from public.perfil where id=p_cliente_id and rol='CLIENTE') then raise exception 'CLIENTE_INVALIDO'; end if;
  if p_fecha_entrega is not null and p_fecha_entrega < current_date then raise exception 'FECHA_INVALIDA'; end if;
  if p_detalles is null or jsonb_typeof(p_detalles) <> 'array' or jsonb_array_length(p_detalles)=0 then raise exception 'DETALLES_REQUERIDOS'; end if;
  if exists(select 1 from jsonb_array_elements(p_detalles) d group by (d->>'producto_id') having count(*) > 1) then raise exception 'PRODUCTO_DUPLICADO'; end if;
  select coalesce(sum((d->>'cantidad')::integer * p.precio_base),0) into v_total
  from jsonb_array_elements(p_detalles) d join public.producto p on p.id=(d->>'producto_id')::bigint
  where p.activo and (d->>'cantidad')::integer > 0;
  if (select count(*) from jsonb_array_elements(p_detalles)) <> (select count(*) from jsonb_array_elements(p_detalles) d join public.producto p on p.id=(d->>'producto_id')::bigint where p.activo and (d->>'cantidad')::integer>0) then raise exception 'DETALLE_INVALIDO'; end if;
  v_numero := 'PED-' || extract(year from current_date)::integer || '-' || lpad(nextval('public.numero_pedido_seq')::text,6,'0');
  insert into public.pedido(numero_pedido,cliente_id,estado,fecha_solicitud,fecha_entrega,total,observaciones)
  values(v_numero,p_cliente_id,'RECIBIDO',current_date,p_fecha_entrega,v_total,nullif(btrim(p_observaciones),'')) returning id into v_id;
  for v_detalle in select value from jsonb_array_elements(p_detalles) loop
    insert into public.detalle_pedido(pedido_id,producto_id,cantidad,precio_unitario,subtotal,personalizacion)
    select v_id,p.id,(v_detalle->>'cantidad')::integer,p.precio_base,(v_detalle->>'cantidad')::integer*p.precio_base,nullif(btrim(v_detalle->>'personalizacion'),'')
    from public.producto p where p.id=(v_detalle->>'producto_id')::bigint and p.activo;
  end loop;
  insert into public.historial_pedido(pedido_id,usuario_id,estado_anterior,estado_nuevo,observacion) values(v_id,auth.uid(),null,'RECIBIDO','Pedido registrado');
  return v_id;
end; $$;

create or replace function public.actualizar_pedido_completo(
  p_pedido_id bigint, p_fecha_entrega date, p_observaciones text, p_detalles jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare v_estado text; v_fecha date; v_total numeric(12,0); v_detalle jsonb;
begin
  if not public.puede_gestionar_pedidos() then raise exception 'NO_AUTORIZADO'; end if;
  select estado,fecha_solicitud into v_estado,v_fecha from public.pedido where id=p_pedido_id for update;
  if not found then raise exception 'PEDIDO_NO_EXISTE'; end if;
  if v_estado in ('ENTREGADO','CANCELADO') then raise exception 'PEDIDO_FINAL'; end if;
  if p_fecha_entrega is not null and p_fecha_entrega < v_fecha then raise exception 'FECHA_INVALIDA'; end if;
  if p_detalles is null or jsonb_typeof(p_detalles)<>'array' or jsonb_array_length(p_detalles)=0 then raise exception 'DETALLES_REQUERIDOS'; end if;
  if exists(select 1 from jsonb_array_elements(p_detalles) d group by (d->>'producto_id') having count(*)>1) then raise exception 'PRODUCTO_DUPLICADO'; end if;
  if exists(select 1 from jsonb_array_elements(p_detalles) d left join public.producto p on p.id=(d->>'producto_id')::bigint where p.id is null or (d->>'cantidad')::integer<=0 or (not p.activo and not exists(select 1 from public.detalle_pedido x where x.pedido_id=p_pedido_id and x.producto_id=p.id))) then raise exception 'DETALLE_INVALIDO'; end if;
  select sum((d->>'cantidad')::integer * p.precio_base) into v_total from jsonb_array_elements(p_detalles) d join public.producto p on p.id=(d->>'producto_id')::bigint;
  delete from public.detalle_pedido where pedido_id=p_pedido_id;
  for v_detalle in select value from jsonb_array_elements(p_detalles) loop
    insert into public.detalle_pedido(pedido_id,producto_id,cantidad,precio_unitario,subtotal,personalizacion)
    select p_pedido_id,p.id,(v_detalle->>'cantidad')::integer,p.precio_base,(v_detalle->>'cantidad')::integer*p.precio_base,nullif(btrim(v_detalle->>'personalizacion'),'') from public.producto p where p.id=(v_detalle->>'producto_id')::bigint;
  end loop;
  update public.pedido set fecha_entrega=p_fecha_entrega,observaciones=nullif(btrim(p_observaciones),''),total=v_total,updated_at=now() where id=p_pedido_id;
end; $$;

create or replace function public.cambiar_estado_pedido(p_pedido_id bigint,p_estado_nuevo text,p_observacion text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_anterior text;
begin
  if not public.puede_gestionar_pedidos() then raise exception 'NO_AUTORIZADO'; end if;
  if p_estado_nuevo not in ('RECIBIDO','EN_REVISION','EN_PRODUCCION','LISTO','ENTREGADO','CANCELADO') then raise exception 'ESTADO_INVALIDO'; end if;
  select estado into v_anterior from public.pedido where id=p_pedido_id for update;
  if not found then raise exception 'PEDIDO_NO_EXISTE'; end if;
  if v_anterior in ('ENTREGADO','CANCELADO') then raise exception 'PEDIDO_FINAL'; end if;
  if v_anterior=p_estado_nuevo then raise exception 'ESTADO_SIN_CAMBIO'; end if;
  update public.pedido set estado=p_estado_nuevo,updated_at=now() where id=p_pedido_id;
  insert into public.historial_pedido(pedido_id,usuario_id,estado_anterior,estado_nuevo,observacion) values(p_pedido_id,auth.uid(),v_anterior,p_estado_nuevo,nullif(btrim(p_observacion),''));
end; $$;

revoke all on function public.puede_gestionar_pedidos(uuid), public.crear_pedido_completo(uuid,date,text,jsonb), public.actualizar_pedido_completo(bigint,date,text,jsonb), public.cambiar_estado_pedido(bigint,text,text) from public;
grant execute on function public.puede_gestionar_pedidos(uuid), public.crear_pedido_completo(uuid,date,text,jsonb), public.actualizar_pedido_completo(bigint,date,text,jsonb), public.cambiar_estado_pedido(bigint,text,text) to authenticated;

create policy "gestor_pedidos_consultar_perfiles" on public.perfil for select to authenticated using (public.puede_gestionar_pedidos());
create policy "pedido_consultar_autorizado" on public.pedido for select to authenticated using (public.puede_gestionar_pedidos() or cliente_id=auth.uid());
create policy "detalle_consultar_autorizado" on public.detalle_pedido for select to authenticated using (exists(select 1 from public.pedido p where p.id=pedido_id and (public.puede_gestionar_pedidos() or p.cliente_id=auth.uid())));
create policy "historial_consultar_autorizado" on public.historial_pedido for select to authenticated using (exists(select 1 from public.pedido p where p.id=pedido_id and (public.puede_gestionar_pedidos() or p.cliente_id=auth.uid())));

revoke all privileges on table public.pedido,public.detalle_pedido,public.historial_pedido from anon,authenticated,service_role;
grant select on table public.pedido,public.detalle_pedido,public.historial_pedido to authenticated;
revoke all privileges on sequence public.pedido_id_seq,public.detalle_pedido_id_seq,public.historial_pedido_id_seq,public.numero_pedido_seq from anon,authenticated,service_role;
