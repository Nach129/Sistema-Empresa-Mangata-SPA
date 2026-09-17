import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DatosProducto, Producto, ProductoBaseDatos } from '../interfaces/producto';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly supabase = inject(SupabaseService).client;

  async obtenerProductos(): Promise<Producto[]> {
    const { data, error } = await this.supabase
      .from('producto')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ProductoBaseDatos[]).map((producto) => this.mapearProducto(producto));
  }

  async obtenerProducto(id: number): Promise<Producto> {
    const { data, error } = await this.supabase.from('producto').select('*').eq('id', id).single();
    if (error) throw error;
    return this.mapearProducto(data as ProductoBaseDatos);
  }

  async crearProducto(datos: DatosProducto): Promise<Producto> {
    const { data, error } = await this.supabase
      .from('producto')
      .insert({ ...this.mapearParaBaseDatos(datos), activo: true })
      .select('*')
      .single();
    if (error) throw error;
    return this.mapearProducto(data as ProductoBaseDatos);
  }

  async actualizarProducto(id: number, datos: DatosProducto): Promise<Producto> {
    const { data, error } = await this.supabase
      .from('producto')
      .update(this.mapearParaBaseDatos(datos))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapearProducto(data as ProductoBaseDatos);
  }

  async cambiarEstado(id: number, activo: boolean): Promise<Producto> {
    const { data, error } = await this.supabase
      .from('producto')
      .update({ activo })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapearProducto(data as ProductoBaseDatos);
  }

  async eliminarProducto(id: number): Promise<void> {
    const { error } = await this.supabase.rpc('eliminar_producto_administrativo', {
      p_producto_id: id,
    });
    if (error) throw error;
  }

  private mapearParaBaseDatos(datos: DatosProducto) {
    return {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      categoria: datos.categoria,
      material: datos.material?.trim() || null,
      precio_base: datos.precioBase,
      imagen_url: datos.imagenUrl?.trim() || null,
    };
  }

  private mapearProducto(producto: ProductoBaseDatos): Producto {
    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      material: producto.material,
      precioBase: Number(producto.precio_base),
      imagenUrl: producto.imagen_url,
      activo: producto.activo,
      fechaCreacion: producto.created_at,
      fechaActualizacion: producto.updated_at,
    };
  }
}

export function mensajeErrorEliminarProducto(error: unknown): string {
  const codigo = obtenerMensajeError(error);
  if (codigo.includes('PRODUCTO_CON_PEDIDOS'))
    return 'No es posible eliminar este producto porque está asociado a uno o más pedidos.';
  if (codigo.includes('NO_AUTORIZADO')) return 'No tienes permisos para realizar esta acción.';
  if (codigo.includes('PRODUCTO_NO_EXISTE'))
    return 'El producto ya no existe o fue eliminado anteriormente.';
  return 'No fue posible eliminar el producto. Intenta nuevamente.';
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
