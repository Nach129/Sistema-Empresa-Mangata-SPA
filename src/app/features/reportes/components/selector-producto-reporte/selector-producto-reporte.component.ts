import { Component, ElementRef, HostListener, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { ProductoFiltroReporte } from '../../interfaces/reporte';

export function normalizarBusquedaProducto(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

@Component({
  selector: 'app-selector-producto-reporte',
  templateUrl: './selector-producto-reporte.component.html',
  styleUrl: './selector-producto-reporte.component.css',
})
export class SelectorProductoReporteComponent {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('controlProducto') controlProducto?: ElementRef<HTMLInputElement>;

  readonly productos = input.required<ProductoFiltroReporte[]>();
  readonly valor = input<number | null>(null);
  readonly deshabilitado = input(false);
  readonly valorChange = output<number | null>();
  readonly abierto = signal(false);
  readonly busqueda = signal('');
  readonly productosFiltrados = computed(() => {
    const termino = normalizarBusquedaProducto(this.busqueda());
    return termino
      ? this.productos().filter((producto) => normalizarBusquedaProducto(producto.nombre).includes(termino))
      : this.productos();
  });
  readonly etiquetaSeleccionada = computed(() => this.productos().find((producto) => producto.id === this.valor())?.nombre ?? 'Todos');

  alternar(evento: MouseEvent): void {
    evento.stopPropagation();
    if (this.deshabilitado()) return;
    this.abierto.update((actual) => !actual);
    if (this.abierto()) queueMicrotask(() => this.controlProducto?.nativeElement.focus());
  }

  abrir(): void {
    if (!this.deshabilitado()) this.abierto.set(true);
  }

  actualizarBusqueda(evento: Event): void {
    this.abierto.set(true);
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  seleccionar(productoId: number | null): void {
    this.valorChange.emit(productoId);
    this.cerrar();
  }

  @HostListener('keydown.escape')
  cerrarConEscape(): void {
    this.cerrar();
  }

  @HostListener('document:click', ['$event'])
  cerrarFuera(evento: MouseEvent): void {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) this.cerrar();
  }

  private cerrar(): void {
    this.abierto.set(false);
    this.busqueda.set('');
  }
}
