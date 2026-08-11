import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductoFormularioComponent } from '../../components/producto-formulario/producto-formulario.component';
import { DatosProducto } from '../../interfaces/producto';
import { ProductoService } from '../../services/producto.service';

@Component({ selector: 'app-nuevo-producto', imports: [RouterLink, ProductoFormularioComponent], templateUrl: './nuevo-producto.component.html', styleUrl: '../producto-edicion.css' })
export class NuevoProductoComponent {
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);
  readonly procesando = signal(false);
  readonly mensajeError = signal('');

  async guardar(datos: DatosProducto): Promise<void> {
    if (this.procesando()) return;
    this.procesando.set(true); this.mensajeError.set('');
    try { await this.productoService.crearProducto(datos); await this.router.navigate(['/productos'], { state: { mensaje: 'Producto registrado correctamente.' } }); }
    catch { this.mensajeError.set('No fue posible registrar el producto. Verifica los datos e inténtalo nuevamente.'); }
    finally { this.procesando.set(false); }
  }
}
