import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { CategoriaProducto } from '../../../../shared/enums/categoria-producto';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { PerfilUsuario } from '../../../usuarios/interfaces/perfil-usuario';
import { Producto } from '../../interfaces/producto';
import { mensajeErrorEliminarProducto, ProductoService } from '../../services/producto.service';
import { ProductosComponent } from './productos.component';

describe('ProductosComponent - eliminación administrativa', () => {
  let fixture: ComponentFixture<ProductosComponent>;
  let componente: ProductosComponent;
  const perfil = signal<PerfilUsuario | null>(crearPerfil(RolUsuario.Administrador));
  const productoService = {
    obtenerProductos: vi.fn<() => Promise<Producto[]>>(),
    cambiarEstado: vi.fn(),
    eliminarProducto: vi.fn<(id: number) => Promise<void>>(),
  };
  const producto = crearProducto(20, 'Producto temporal');

  beforeEach(async () => {
    productoService.obtenerProductos.mockReset().mockResolvedValue([producto]);
    productoService.eliminarProducto.mockReset().mockResolvedValue();
    perfil.set(crearPerfil(RolUsuario.Administrador));
    await TestBed.configureTestingModule({
      imports: [ProductosComponent],
      providers: [
        provideRouter([]),
        { provide: ProductoService, useValue: productoService },
        { provide: AutenticacionService, useValue: { perfil } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductosComponent);
    componente = fixture.componentInstance;
    await fixture.whenStable();
    componente.productos.set([producto]);
  });

  it('elimina el producto del catálogo y muestra el mensaje de éxito', async () => {
    componente.solicitarEliminacion(producto);
    await componente.confirmarEliminacion();

    expect(productoService.eliminarProducto).toHaveBeenCalledWith(producto.id);
    expect(componente.productos()).toEqual([]);
    expect(componente.mensajeExito()).toBe('Producto eliminado correctamente.');
  });

  it('no invoca la eliminación si el perfil es cliente', async () => {
    perfil.set(crearPerfil(RolUsuario.Cliente));
    componente.solicitarEliminacion(producto);
    await componente.confirmarEliminacion();

    expect(componente.productoAEliminar()).toBeNull();
    expect(productoService.eliminarProducto).not.toHaveBeenCalled();
  });

  it('mantiene el producto y muestra un mensaje amigable si posee pedidos', async () => {
    productoService.eliminarProducto.mockRejectedValue({ message: 'PRODUCTO_CON_PEDIDOS' });
    componente.solicitarEliminacion(producto);
    await componente.confirmarEliminacion();

    expect(componente.productos()).toEqual([producto]);
    expect(componente.mensajeError()).toBe(
      'No es posible eliminar este producto porque está asociado a uno o más pedidos.',
    );
  });

  it('traduce los errores de permisos', () => {
    expect(mensajeErrorEliminarProducto({ message: 'NO_AUTORIZADO' })).toBe(
      'No tienes permisos para realizar esta acción.',
    );
  });
});

function crearPerfil(rol: RolUsuario): PerfilUsuario {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Ana',
    apellido: 'Pérez',
    rut: '12.345.678-5',
    correo: 'ana@mangata.cl',
    telefono: null,
    rol,
    created_at: '',
    updated_at: '',
  };
}

function crearProducto(id: number, nombre: string): Producto {
  return {
    id,
    nombre,
    descripcion: null,
    categoria: CategoriaProducto.Trofeo,
    material: null,
    precioBase: 10000,
    imagenUrl: null,
    activo: true,
    fechaCreacion: '',
    fechaActualizacion: '',
  };
}
