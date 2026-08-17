import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductoFiltroReporte } from '../../interfaces/reporte';
import { SelectorProductoReporteComponent, normalizarBusquedaProducto } from './selector-producto-reporte.component';

describe('SelectorProductoReporteComponent', () => {
  let fixture: ComponentFixture<SelectorProductoReporteComponent>;
  let componente: SelectorProductoReporteComponent;
  const productos: ProductoFiltroReporte[] = [
    { id: 1, nombre: 'Trofeo Corporativo Andino', activo: true },
    { id: 2, nombre: 'Trofeo deportivo Arica', activo: true },
    { id: 3, nombre: 'Copa del mundo', activo: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectorProductoReporteComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectorProductoReporteComponent);
    fixture.componentRef.setInput('productos', productos);
    fixture.componentRef.setInput('valor', null);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('abre, cierra con Escape y conserva Todos como valor inicial', () => {
    componente.alternar(new MouseEvent('click'));
    expect(componente.abierto()).toBe(true);
    expect(componente.etiquetaSeleccionada()).toBe('Todos');
    componente.cerrarConEscape();
    expect(componente.abierto()).toBe(false);
  });

  it('busca en tiempo real ignorando mayúsculas y espacios sobrantes', () => {
    const control = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.control-producto')!;
    control.value = '  TrOf  ';
    control.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(componente.abierto()).toBe(true);
    expect(componente.productosFiltrados().map((producto) => producto.id)).toEqual([1, 2]);
    expect(normalizarBusquedaProducto('  TROFEO   Andino ')).toBe('trofeo andino');
  });

  it('selecciona un producto, cierra el panel y permite volver a Todos', () => {
    const emitir = vi.spyOn(componente.valorChange, 'emit');
    componente.abierto.set(true);
    componente.seleccionar(3);
    expect(emitir).toHaveBeenCalledWith(3);
    expect(componente.abierto()).toBe(false);
    componente.seleccionar(null);
    expect(emitir).toHaveBeenCalledWith(null);
  });

  it('conserva productos inactivos y muestra estado sin coincidencias', () => {
    expect(componente.productosFiltrados().some((producto) => !producto.activo)).toBe(true);
    componente.abierto.set(true);
    componente.busqueda.set('producto inexistente');
    fixture.detectChanges();
    expect(componente.productosFiltrados()).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se encontraron productos.');
  });

  it('mantiene una lista extensa disponible para el panel con scroll', () => {
    const listaExtensa = Array.from({ length: 100 }, (_, indice) => ({ id: indice + 1, nombre: `Producto ${indice + 1}`, activo: indice % 2 === 0 }));
    fixture.componentRef.setInput('productos', listaExtensa);
    fixture.detectChanges();
    expect(componente.productosFiltrados()).toHaveLength(100);
  });
});
