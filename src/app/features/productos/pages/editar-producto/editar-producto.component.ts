import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoFormularioComponent } from '../../components/producto-formulario/producto-formulario.component';
import { DatosProducto, Producto } from '../../interfaces/producto';
import { ProductoService } from '../../services/producto.service';

@Component({ selector: 'app-editar-producto', imports: [RouterLink, ProductoFormularioComponent], templateUrl: './editar-producto.component.html', styleUrl: '../producto-edicion.css' })
export class EditarProductoComponent {
  private readonly productoService = inject(ProductoService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly producto = signal<Producto | null>(null);
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly mensajeError = signal('');
  private readonly id = Number(this.ruta.snapshot.paramMap.get('id'));

  constructor() { void this.cargar(); }
  private async cargar(): Promise<void> {
    if (!Number.isSafeInteger(this.id) || this.id <= 0) { this.mensajeError.set('El producto solicitado no es válido.'); this.cargando.set(false); return; }
    try { this.producto.set(await this.productoService.obtenerProducto(this.id)); }
    catch { this.mensajeError.set('No fue posible cargar el producto.'); }
    finally { this.cargando.set(false); }
  }
  async guardar(datos: DatosProducto): Promise<void> {
    if (this.procesando()) return;
    this.procesando.set(true); this.mensajeError.set('');
    try { await this.productoService.actualizarProducto(this.id, datos); await this.router.navigate(['/productos'], { state: { mensaje: 'Producto actualizado correctamente.' } }); }
    catch { this.mensajeError.set('No fue posible actualizar el producto. Verifica los datos e inténtalo nuevamente.'); }
    finally { this.procesando.set(false); }
  }
}
