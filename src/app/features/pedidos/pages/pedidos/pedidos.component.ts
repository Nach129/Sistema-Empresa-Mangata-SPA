import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { EstadoPedido } from '../../../../shared/enums/estado-pedido';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { Pedido } from '../../interfaces/pedido';
import { mensajeErrorEliminarPedido, PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-pedidos',
  imports: [RouterLink],
  templateUrl: './pedidos.component.html',
  styleUrl: '../pedidos-paginas.css',
})
export class PedidosComponent {
  private readonly pedidoService = inject(PedidoService);
  private readonly autenticacion = inject(AutenticacionService);

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(true);
  readonly eliminando = signal(false);
  readonly error = signal('');
  readonly exito = signal(
    typeof history.state?.['mensaje'] === 'string' ? history.state['mensaje'] : '',
  );
  readonly busqueda = signal('');
  readonly estado = signal('');
  readonly pedidoAEliminar = signal<Pedido | null>(null);
  readonly estados = Object.values(EstadoPedido);
  readonly puedeGestionar = computed(
    () => this.autenticacion.perfil()?.rol === RolUsuario.Administrador,
  );
  readonly filtrados = computed(() => {
    const consulta = this.busqueda().trim().toLocaleLowerCase('es');
    return this.pedidos().filter(
      (pedido) =>
        (!consulta ||
          pedido.numeroPedido.toLowerCase().includes(consulta) ||
          `${pedido.cliente?.nombre} ${pedido.cliente?.apellido}`
            .toLocaleLowerCase('es')
            .includes(consulta)) &&
        (!this.estado() || pedido.estado === this.estado()),
    );
  });

  constructor() {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.pedidos.set(await this.pedidoService.obtenerPedidos());
    } catch {
      this.error.set('No fue posible cargar los pedidos.');
    } finally {
      this.cargando.set(false);
    }
  }

  solicitarEliminacion(pedido: Pedido): void {
    if (!this.puedeGestionar()) return;
    this.pedidoAEliminar.set(pedido);
    this.error.set('');
    this.exito.set('');
  }

  cerrarEliminacion(): void {
    if (!this.eliminando()) this.pedidoAEliminar.set(null);
  }

  async confirmarEliminacion(): Promise<void> {
    const pedido = this.pedidoAEliminar();
    if (!pedido || !this.puedeGestionar() || this.eliminando()) return;
    this.eliminando.set(true);
    this.error.set('');
    try {
      await this.pedidoService.eliminarPedido(pedido.id);
      this.pedidos.update((pedidos) => pedidos.filter((actual) => actual.id !== pedido.id));
      this.pedidoAEliminar.set(null);
      this.exito.set('Pedido eliminado correctamente.');
    } catch (error: unknown) {
      this.error.set(mensajeErrorEliminarPedido(error));
      this.pedidoAEliminar.set(null);
    } finally {
      this.eliminando.set(false);
    }
  }

  actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
  actualizarEstado(evento: Event): void {
    this.estado.set((evento.target as HTMLSelectElement).value);
  }
  dinero(valor: number): string {
    return valor.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
  }
  fecha(valor: string | null): string {
    return valor
      ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'UTC' }).format(
          new Date(`${valor}T00:00:00Z`),
        )
      : 'Sin definir';
  }
  etiqueta(valor: string): string {
    return valor.replaceAll('_', ' ');
  }
}
