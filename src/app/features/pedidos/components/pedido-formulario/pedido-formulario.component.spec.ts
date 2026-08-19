import { TestBed } from '@angular/core/testing';
import { CategoriaProducto } from '../../../../shared/enums/categoria-producto';
import { PedidoFormularioComponent } from './pedido-formulario.component';

describe('PedidoFormularioComponent', () => {
  it('recalcula subtotales y total al cambiar cantidades', async () => {
    await TestBed.configureTestingModule({ imports: [PedidoFormularioComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PedidoFormularioComponent);
    fixture.componentRef.setInput('clientes', []);
    fixture.componentRef.setInput('productos', [{ id: 1, nombre: 'Trofeo', categoria: CategoriaProducto.Trofeo, precioBase: 15000, activo: true, descripcion: null, material: null, imagenUrl: null, fechaCreacion: '', fechaActualizacion: '' }]);
    fixture.detectChanges();
    const componente = fixture.componentInstance;
    componente.agregarLinea({ productoId: 1, cantidad: 2, personalizacion: null });
    expect(componente.total()).toBe(30000);
    componente.cambiarCantidad(0, { target: { value: '3' } } as unknown as Event);
    expect(componente.total()).toBe(45000);
  });

  it('no emite sin cliente ni productos', async () => {
    await TestBed.configureTestingModule({ imports: [PedidoFormularioComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PedidoFormularioComponent);
    fixture.componentRef.setInput('clientes', []);
    fixture.componentRef.setInput('productos', []);
    fixture.detectChanges();
    const emitir = vi.spyOn(fixture.componentInstance.confirmar, 'emit');
    fixture.componentInstance.enviar();
    expect(emitir).not.toHaveBeenCalled();
  });
});
