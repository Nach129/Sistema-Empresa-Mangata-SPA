import { Injectable, inject } from '@angular/core';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DatosPerfilActualizables, DatosUsuarioAdministrables, NuevoUsuario, PerfilUsuario } from '../interfaces/perfil-usuario';

interface RespuestaAdministrativa {
  codigo?: string;
  usuarios?: PerfilUsuario[];
  usuario?: PerfilUsuario;
  eliminado?: boolean;
}

type SolicitudAdministrativa =
  | { accion: 'listar' }
  | { accion: 'actualizar'; usuario: DatosUsuarioAdministrables }
  | { accion: 'eliminar'; id: string };

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly autenticacion = inject(AutenticacionService);

  async registrarUsuario(usuario: NuevoUsuario): Promise<void> {
    const { error } = await this.supabase.functions.invoke('registrar-usuario', { body: usuario });
    if (error) throw error;
  }

  async listarUsuarios(): Promise<PerfilUsuario[]> {
    const respuesta = await this.invocarAdministracion({ accion: 'listar' });
    return respuesta.usuarios ?? [];
  }

  async obtenerUsuario(id: string): Promise<PerfilUsuario> {
    const usuario = (await this.listarUsuarios()).find((item) => item.id === id);
    if (!usuario) throw new Error('USUARIO_NO_EXISTE');
    return usuario;
  }

  async actualizarUsuario(datos: DatosUsuarioAdministrables): Promise<PerfilUsuario> {
    const respuesta = await this.invocarAdministracion({ accion: 'actualizar', usuario: datos });
    if (!respuesta.usuario) throw new Error('ERROR_ACTUALIZACION');
    if (datos.id === this.autenticacion.perfil()?.id) this.autenticacion.actualizarPerfilLocal(respuesta.usuario);
    return respuesta.usuario;
  }

  async eliminarUsuario(id: string): Promise<void> {
    const respuesta = await this.invocarAdministracion({ accion: 'eliminar', id });
    if (!respuesta.eliminado) throw new Error('ERROR_ELIMINACION');
  }

  async actualizarPerfil(datos: DatosPerfilActualizables): Promise<PerfilUsuario> {
    const perfilActual = this.autenticacion.perfil() ?? await this.autenticacion.cargarPerfil();
    const correoCambio = datos.correo.trim().toLowerCase() !== perfilActual.correo.toLowerCase();
    if (correoCambio) {
      const { error: errorAuth } = await this.supabase.auth.updateUser({ email: datos.correo.trim().toLowerCase() });
      if (errorAuth) throw errorAuth;
    }
    const { data, error } = await this.supabase.from('perfil').update({ ...datos, correo: datos.correo.trim().toLowerCase() }).eq('id', perfilActual.id).select('*').single();
    if (error) throw error;
    const perfil = data as PerfilUsuario;
    this.autenticacion.actualizarPerfilLocal(perfil);
    return perfil;
  }

  private async invocarAdministracion(solicitud: SolicitudAdministrativa): Promise<RespuestaAdministrativa> {
    const { data, error } = await this.supabase.functions.invoke<RespuestaAdministrativa>('administrar-usuarios', { body: solicitud });
    if (error) {
      let codigo = 'ERROR_ADMINISTRACION';
      const contexto = (error as { context?: unknown }).context;
      if (contexto instanceof Response) {
        try { codigo = ((await contexto.json()) as RespuestaAdministrativa).codigo ?? codigo; } catch { /* Respuesta sin JSON. */ }
      }
      throw new Error(codigo);
    }
    if (!data || data.codigo) throw new Error(data?.codigo ?? 'ERROR_ADMINISTRACION');
    return data;
  }
}

export function mensajeErrorAdministracion(error: unknown): string {
  const codigo = error instanceof Error ? error.message : '';
  const mensajes: Record<string, string> = {
    ULTIMO_ADMINISTRADOR: 'No es posible cambiar el rol del último administrador del sistema.',
    AUTOELIMINACION: 'No puedes eliminar tu propia cuenta.',
    REGISTROS_ASOCIADOS: 'No es posible eliminar este usuario porque posee registros asociados.',
    CORREO_REPETIDO: 'El correo ya se encuentra registrado.',
    RUT_REPETIDO: 'El RUT ya se encuentra registrado.',
    USUARIO_NO_EXISTE: 'El usuario solicitado no existe.',
    NO_AUTORIZADO: 'No tienes permisos para realizar esta operación.',
  };
  return mensajes[codigo] ?? 'No fue posible completar la operación. Inténtalo nuevamente.';
}
