import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { EstadoPedido } from '../../../../shared/enums/estado-pedido';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { PerfilUsuario } from '../../../usuarios/interfaces/perfil-usuario';
import { Pedido } from '../../interfaces/pedido';
import { PedidoService, mensajeErrorEliminarPedido } from '../../services/pedido.service';
import { PedidosComponent } from './pedidos.component';

describe('PedidosComponent - eliminación administrativa', () => {
  let fixture: ComponentFixture<PedidosComponent>;
  let componente: PedidosComponent;
  const perfil = signal<PerfilUsuario | null>(crearPerfil(RolUsuario.Administrador));
  const pedidoService = {
    obtenerPedidos: vi.fn<() => Promise<Pedido[]>>(),
    eliminarPedido: vi.fn<(id: number) => Promise<void>>(),
  };
  const pedido = crearPedido(10, 'PED-2026-000010');

  beforeEach(async () => {
    pedidoService.obtenerPedidos.mockReset().mockResolvedValue([pedido]);
    pedidoService.eliminarPedido.mockReset().mockResolvedValue();
    perfil.set(crearPerfil(RolUsuario.Administrador));
    await TestBed.configureTestingModule({
      imports: [PedidosComponent],
      providers: [
        provideRouter([]),
        { provide: PedidoService, useValue: pedidoService },
        { provide: AutenticacionService, useValue: { perfil } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PedidosComponent);
    componente = fixture.componentInstance;
    await fixture.whenStable();
    componente.pedidos.set([pedido]);
  });

  it('elimina el pedido del listado y muestra el mensaje de éxito', async () => {
    componente.solicitarEliminacion(pedido);
    await componente.confirmarEliminacion();

    expect(pedidoService.eliminarPedido).toHaveBeenCalledWith(pedido.id);
    expect(componente.pedidos()).toEqual([]);
    expect(componente.exito()).toBe('Pedido eliminado correctamente.');
  });

  it('no invoca la eliminación si el perfil es trabajador', async () => {
    perfil.set(crearPerfil(RolUsuario.Trabajador));
    componente.solicitarEliminacion(pedido);
    await componente.confirmarEliminacion();

    expect(componente.pedidoAEliminar()).toBeNull();
    expect(pedidoService.eliminarPedido).not.toHaveBeenCalled();
  });

  it('traduce los errores de permisos y pedido inexistente', () => {
    expect(mensajeErrorEliminarPedido({ message: 'NO_AUTORIZADO' })).toBe(
      'No tienes permisos para realizar esta acción.',
    );
    expect(mensajeErrorEliminarPedido({ message: 'PEDIDO_NO_EXISTE' })).toBe(
      'El pedido ya no existe o fue eliminado anteriormente.',
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

function crearPedido(id: number, numeroPedido: string): Pedido {
  return {
    id,
    numeroPedido,
    clienteId: '00000000-0000-0000-0000-000000000002',
    cliente: {
      id: '00000000-0000-0000-0000-000000000002',
      nombre: 'Cliente',
      apellido: 'Temporal',
      rut: '11.111.111-1',
      correo: 'cliente@mangata.cl',
    },
    estado: EstadoPedido.Recibido,
    fechaSolicitud: '2026-09-16',
    fechaEntrega: null,
    total: 10000,
    observaciones: null,
    fechaCreacion: '',
  };
}
