import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { CategoriaProducto } from '../../../../shared/enums/categoria-producto';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { Producto } from '../../interfaces/producto';
import { mensajeErrorEliminarProducto, ProductoService } from '../../services/producto.service';

type FiltroEstado = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

@Component({
  selector: 'app-productos',
  imports: [RouterLink],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent {
  private readonly productoService = inject(ProductoService);
  private readonly autenticacion = inject(AutenticacionService);

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly cambiandoEstado = signal(false);
  readonly eliminando = signal(false);
  readonly mensajeError = signal('');
  readonly mensajeExito = signal('');
  readonly busqueda = signal('');
  readonly categoria = signal('');
  readonly estado = signal<FiltroEstado>('TODOS');
  readonly productoConfirmacion = signal<Producto | null>(null);
  readonly productoAEliminar = signal<Producto | null>(null);
  readonly categorias = Object.values(CategoriaProducto);
  readonly puedeGestionar = computed(() => {
    const rol = this.autenticacion.perfil()?.rol;
    return rol === RolUsuario.Administrador;
  });
  readonly productosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es');
    return this.productos().filter((producto) => {
      const coincideNombre = !texto || producto.nombre.toLocaleLowerCase('es').includes(texto);
      const coincideCategoria = !this.categoria() || producto.categoria === this.categoria();
      const coincideEstado =
        this.estado() === 'TODOS' ||
        (this.estado() === 'ACTIVOS' && producto.activo) ||
        (this.estado() === 'INACTIVOS' && !producto.activo);
      return coincideNombre && coincideCategoria && coincideEstado;
    });
  });

  constructor() {
    const mensajeNavegacion: unknown = history.state?.['mensaje'];
    if (typeof mensajeNavegacion === 'string') this.mensajeExito.set(mensajeNavegacion);
    void this.cargarProductos();
  }

  async cargarProductos(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError.set('');
    try {
      this.productos.set(await this.productoService.obtenerProductos());
    } catch {
      this.mensajeError.set('No fue posible cargar los productos.');
    } finally {
      this.cargando.set(false);
    }
  }

  actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
  actualizarCategoria(evento: Event): void {
    this.categoria.set((evento.target as HTMLSelectElement).value);
  }
  actualizarEstado(evento: Event): void {
    this.estado.set((evento.target as HTMLSelectElement).value as FiltroEstado);
  }
  solicitarCambioEstado(producto: Producto): void {
    this.productoConfirmacion.set(producto);
    this.mensajeExito.set('');
  }
  solicitarEliminacion(producto: Producto): void {
    if (!this.puedeGestionar()) return;
    this.productoAEliminar.set(producto);
    this.mensajeError.set('');
    this.mensajeExito.set('');
  }

  cerrarEliminacion(): void {
    if (!this.eliminando()) this.productoAEliminar.set(null);
  }

  async confirmarCambioEstado(): Promise<void> {
    const producto = this.productoConfirmacion();
    if (!producto || this.cambiandoEstado()) return;
    this.cambiandoEstado.set(true);
    this.mensajeError.set('');
    try {
      const actualizado = await this.productoService.cambiarEstado(producto.id, !producto.activo);
      this.productos.update((productos) =>
        productos.map((actual) => (actual.id === actualizado.id ? actualizado : actual)),
      );
      this.mensajeExito.set(
        actualizado.activo ? 'El producto fue reactivado.' : 'El producto fue desactivado.',
      );
      this.productoConfirmacion.set(null);
    } catch {
      this.mensajeError.set('No fue posible cambiar el estado del producto.');
    } finally {
      this.cambiandoEstado.set(false);
    }
  }

  async confirmarEliminacion(): Promise<void> {
    const producto = this.productoAEliminar();
    if (!producto || !this.puedeGestionar() || this.eliminando()) return;
    this.eliminando.set(true);
    this.mensajeError.set('');
    try {
      await this.productoService.eliminarProducto(producto.id);
      this.productos.update((productos) => productos.filter((actual) => actual.id !== producto.id));
      this.productoAEliminar.set(null);
      this.mensajeExito.set('Producto eliminado correctamente.');
    } catch (error: unknown) {
      this.mensajeError.set(mensajeErrorEliminarProducto(error));
      this.productoAEliminar.set(null);
    } finally {
      this.eliminando.set(false);
    }
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(precio);
  }
}
