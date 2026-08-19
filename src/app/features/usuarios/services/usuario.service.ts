import { Injectable, inject } from '@angular/core';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { normalizarDatosFormularioUsuario } from '../../../shared/validators/datos-usuario.validators';
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
    const normalizados = normalizarDatosFormularioUsuario({ ...usuario, telefono: usuario.telefono ?? '' });
    const { error } = await this.supabase.functions.invoke('registrar-usuario', { body: { ...normalizados, telefono: normalizados.telefono || null } });
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
    const normalizados = normalizarDatosFormularioUsuario({ ...datos, telefono: datos.telefono ?? '' });
    const usuario = { ...normalizados, telefono: normalizados.telefono || null };
    const respuesta = await this.invocarAdministracion({ accion: 'actualizar', usuario });
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
    const normalizadosFormulario = normalizarDatosFormularioUsuario({ ...datos, telefono: datos.telefono ?? '' });
    const normalizados = { ...normalizadosFormulario, telefono: normalizadosFormulario.telefono || null };
    const actualesFormulario = normalizarDatosFormularioUsuario({ ...perfilActual, telefono: perfilActual.telefono ?? '' });
    const actuales = { ...actualesFormulario, telefono: actualesFormulario.telefono || null };
    const cambios: Partial<DatosPerfilActualizables> = {};
    const campos = ['nombre', 'apellido', 'rut', 'correo', 'telefono'] as const;
    for (const campo of campos) {
      if (normalizados[campo] !== actuales[campo]) cambios[campo] = normalizados[campo] as never;
    }
    if (!Object.keys(cambios).length) return perfilActual;
    const correoCambio = cambios.correo !== undefined;
    if (correoCambio) {
      const { error: errorAuth } = await this.supabase.auth.updateUser({ email: cambios.correo });
      if (errorAuth) throw errorAuth;
    }
    const { data, error } = await this.supabase.from('perfil').update(cambios).eq('id', perfilActual.id).select('*').single();
    if (error) {
      if (correoCambio) await this.supabase.auth.updateUser({ email: perfilActual.correo });
      throw error;
    }
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
