import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriaProducto } from '../../../../shared/enums/categoria-producto';
import { ProductoFormularioComponent } from './producto-formulario.component';

describe('ProductoFormularioComponent', () => {
  let fixture: ComponentFixture<ProductoFormularioComponent>;
  let componente: ProductoFormularioComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductoFormularioComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProductoFormularioComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe impedir enviar un formulario sin campos obligatorios', () => {
    componente.formulario.patchValue({ nombre: '', categoria: '', precioBase: -1 });
    const emitir = vi.spyOn(componente.confirmar, 'emit');
    componente.enviar();
    expect(componente.formulario.invalid).toBe(true);
    expect(emitir).not.toHaveBeenCalled();
  });

  it('debe emitir datos normalizados cuando el formulario es válido', () => {
    componente.formulario.setValue({
      nombre: '  Trofeo Clásico  ', descripcion: '  Diseño corporativo  ', categoria: CategoriaProducto.Trofeo,
      material: '  PLA  ', precioBase: 15000, imagenUrl: '',
    });
    const emitir = vi.spyOn(componente.confirmar, 'emit');
    componente.enviar();
    expect(emitir).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Trofeo Clásico', precioBase: 15000, imagenUrl: null }));
  });
});
