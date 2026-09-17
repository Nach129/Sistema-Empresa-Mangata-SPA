import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Producto, ProductoBaseDatos } from '../../productos/interfaces/producto';
import {
  ClientePedido,
  DatosPedido,
  DetalleBaseDatos,
  HistorialBaseDatos,
  NuevoClientePedido,
  Pedido,
  PedidoBaseDatos,
  PedidoCompleto,
} from '../interfaces/pedido';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly supabase = inject(SupabaseService).client;

  async obtenerClientes(): Promise<ClientePedido[]> {
    const { data, error } = await this.supabase
      .from('perfil')
      .select('id,nombre,apellido,rut,correo')
      .eq('rol', 'CLIENTE')
      .order('nombre');
    if (error) throw error;
    return data as ClientePedido[];
  }
  async registrarCliente(datos: NuevoClientePedido): Promise<ClientePedido> {
    const { error } = await this.supabase.functions.invoke('registrar-usuario', {
      body: { ...datos, rol: 'CLIENTE', sinAcceso: true },
    });
    if (error) throw error;
    const { data, error: errorPerfil } = await this.supabase
      .from('perfil')
      .select('id,nombre,apellido,rut,correo')
      .eq('correo', datos.correo.trim().toLowerCase())
      .single();
    if (errorPerfil) throw errorPerfil;
    return data as ClientePedido;
  }
  async obtenerProductosDisponibles(): Promise<Producto[]> {
    const { data, error } = await this.supabase
      .from('producto')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return (data as ProductoBaseDatos[]).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoria: p.categoria,
      material: p.material,
      precioBase: Number(p.precio_base),
      imagenUrl: p.imagen_url,
      activo: p.activo,
      fechaCreacion: p.created_at,
      fechaActualizacion: p.updated_at,
    }));
  }
  async obtenerPedidos(): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('pedido')
      .select('*,cliente:perfil!cliente_id(id,nombre,apellido,rut,correo)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as unknown as PedidoBaseDatos[]).map((p) => this.mapearPedido(p));
  }
  async obtenerPedidosPorCliente(clienteId: string): Promise<Pedido[]> {
    return (await this.obtenerPedidos()).filter((p) => p.clienteId === clienteId);
  }
  async obtenerPedido(id: number): Promise<PedidoCompleto> {
    const [pedidoR, detalleR, historialR] = await Promise.all([
      this.supabase
        .from('pedido')
        .select('*,cliente:perfil!cliente_id(id,nombre,apellido,rut,correo)')
        .eq('id', id)
        .single(),
      this.supabase
        .from('detalle_pedido')
        .select(
          'id,producto_id,cantidad,precio_unitario,subtotal,personalizacion,producto:producto(id,nombre,categoria,activo)',
        )
        .eq('pedido_id', id)
        .order('id'),
      this.supabase.rpc('obtener_historial_pedido', { p_pedido_id: id }),
    ]);
    if (pedidoR.error || detalleR.error || historialR.error)
      throw pedidoR.error ?? detalleR.error ?? historialR.error;
    const pedido = this.mapearPedido(pedidoR.data as unknown as PedidoBaseDatos);
    return {
      ...pedido,
      detalles: (detalleR.data as unknown as DetalleBaseDatos[]).map((d) => ({
        id: d.id,
        productoId: d.producto_id,
        cantidad: d.cantidad,
        precioUnitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
        personalizacion: d.personalizacion,
        producto: d.producto,
      })),
      historial: (historialR.data as unknown as HistorialBaseDatos[]).map((h) => ({
        id: h.id,
        estadoAnterior: h.estado_anterior,
        estadoNuevo: h.estado_nuevo,
        observacion: h.observacion,
        fecha: h.created_at,
        responsable: h.responsable_nombre
          ? `${h.responsable_nombre} ${h.responsable_apellido ?? ''}`.trim()
          : 'Usuario interno',
      })),
    };
  }
  async crearPedido(datos: DatosPedido): Promise<number> {
    const { data, error } = await this.supabase.rpc('crear_pedido_completo', {
      p_cliente_id: datos.clienteId,
      p_fecha_entrega: datos.fechaEntrega,
      p_observaciones: datos.observaciones,
      p_detalles: this.detallesRpc(datos),
    });
    if (error) throw error;
    return Number(data);
  }
  async actualizarPedido(id: number, datos: DatosPedido): Promise<void> {
    const { error } = await this.supabase.rpc('actualizar_pedido_completo', {
      p_pedido_id: id,
      p_fecha_entrega: datos.fechaEntrega,
      p_observaciones: datos.observaciones,
      p_detalles: this.detallesRpc(datos),
    });
    if (error) throw error;
  }
  async cambiarEstado(id: number, estado: string, observacion: string | null): Promise<void> {
    const { error } = await this.supabase.rpc('cambiar_estado_pedido', {
      p_pedido_id: id,
      p_estado_nuevo: estado,
      p_observacion: observacion,
    });
    if (error) throw error;
  }
  async eliminarPedido(id: number): Promise<void> {
    const { error } = await this.supabase.rpc('eliminar_pedido_administrativo', {
      p_pedido_id: id,
    });
    if (error) throw error;
  }
  private detallesRpc(datos: DatosPedido) {
    return datos.detalles.map((d) => ({
      producto_id: d.productoId,
      cantidad: d.cantidad,
      personalizacion: d.personalizacion,
    }));
  }
  private mapearPedido(p: PedidoBaseDatos): Pedido {
    return {
      id: p.id,
      numeroPedido: p.numero_pedido,
      clienteId: p.cliente_id,
      cliente: p.cliente,
      estado: p.estado,
      fechaSolicitud: p.fecha_solicitud,
      fechaEntrega: p.fecha_entrega,
      total: Number(p.total),
      observaciones: p.observaciones,
      fechaCreacion: p.created_at,
    };
  }
}

export function mensajeErrorEliminarPedido(error: unknown): string {
  const codigo = obtenerMensajeError(error);
  if (codigo.includes('NO_AUTORIZADO')) return 'No tienes permisos para realizar esta acción.';
  if (codigo.includes('PEDIDO_NO_EXISTE'))
    return 'El pedido ya no existe o fue eliminado anteriormente.';
  return 'No fue posible eliminar el pedido. Intenta nuevamente.';
}

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
    return error.message;
  return '';
}
