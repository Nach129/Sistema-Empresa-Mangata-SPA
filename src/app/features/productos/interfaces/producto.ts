import { CategoriaProducto } from '../../../shared/enums/categoria-producto';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaProducto;
  material: string | null;
  precioBase: number;
  imagenUrl: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DatosProducto {
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaProducto;
  material: string | null;
  precioBase: number;
  imagenUrl: string | null;
}

export interface ProductoBaseDatos {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaProducto;
  material: string | null;
  precio_base: number | string;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
