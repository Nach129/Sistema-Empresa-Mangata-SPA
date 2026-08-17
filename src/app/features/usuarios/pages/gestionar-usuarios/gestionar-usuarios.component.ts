import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { PerfilUsuario } from '../../interfaces/perfil-usuario';
import { UsuarioService, mensajeErrorAdministracion } from '../../services/usuario.service';
import { filtrarUsuarios, puedeEliminarUsuario } from '../../utils/filtro-usuarios';

@Component({
  selector: 'app-gestionar-usuarios',
  imports: [RouterLink],
  templateUrl: './gestionar-usuarios.component.html',
  styleUrl: './gestionar-usuarios.component.css',
})
export class GestionarUsuariosComponent {
  private readonly usuariosService = inject(UsuarioService);
  readonly autenticacion = inject(AutenticacionService);
  readonly usuarios = signal<PerfilUsuario[]>([]);
  readonly busqueda = signal('');
  readonly rol = signal<RolUsuario | ''>('');
  readonly roles = Object.values(RolUsuario);
  readonly cargando = signal(true);
  readonly eliminando = signal(false);
  readonly error = signal('');
  readonly exito = signal(typeof history.state['mensaje'] === 'string' ? history.state['mensaje'] : '');
  readonly usuarioAEliminar = signal<PerfilUsuario | null>(null);
  readonly usuariosFiltrados = computed(() => filtrarUsuarios(this.usuarios(), this.busqueda(), this.rol()));

  constructor() { void this.cargar(); }

  actualizarBusqueda(evento: Event): void { this.busqueda.set((evento.target as HTMLInputElement).value); }
  actualizarRol(evento: Event): void { this.rol.set((evento.target as HTMLSelectElement).value as RolUsuario | ''); }

  solicitarEliminacion(usuario: PerfilUsuario): void {
    if (puedeEliminarUsuario(usuario.id, this.autenticacion.perfil()?.id)) this.usuarioAEliminar.set(usuario);
  }

  cerrarEliminacion(): void { if (!this.eliminando()) this.usuarioAEliminar.set(null); }

  async confirmarEliminacion(): Promise<void> {
    const usuario = this.usuarioAEliminar();
    if (!usuario || this.eliminando()) return;
    this.eliminando.set(true); this.error.set(''); this.exito.set('');
    try {
      await this.usuariosService.eliminarUsuario(usuario.id);
      this.usuarios.update((actuales) => actuales.filter((item) => item.id !== usuario.id));
      this.usuarioAEliminar.set(null);
      this.exito.set('Usuario eliminado correctamente.');
    } catch (error) { this.error.set(mensajeErrorAdministracion(error)); }
    finally { this.eliminando.set(false); }
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void { this.cerrarEliminacion(); }

  private async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set('');
    try { this.usuarios.set(await this.usuariosService.listarUsuarios()); }
    catch (error) { this.error.set(mensajeErrorAdministracion(error)); }
    finally { this.cargando.set(false); }
  }
}
