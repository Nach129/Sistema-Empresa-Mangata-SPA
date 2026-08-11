import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { DatosPerfilActualizables, NuevoUsuario, PerfilUsuario } from '../interfaces/perfil-usuario';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly autenticacion = inject(AutenticacionService);

  async registrarUsuario(usuario: NuevoUsuario): Promise<void> {
    const { error } = await this.supabase.functions.invoke('registrar-usuario', { body: usuario });
    if (error) throw error;
  }

  async actualizarPerfil(datos: DatosPerfilActualizables): Promise<PerfilUsuario> {
    const perfilActual = this.autenticacion.perfil() ?? await this.autenticacion.cargarPerfil();
    const correoCambio = datos.correo.trim().toLowerCase() !== perfilActual.correo.toLowerCase();
    if (correoCambio) {
      const { error: errorAuth } = await this.supabase.auth.updateUser({ email: datos.correo.trim().toLowerCase() });
      if (errorAuth) throw errorAuth;
    }
    const { data, error } = await this.supabase
      .from('perfil')
      .update({ ...datos, correo: datos.correo.trim().toLowerCase() })
      .eq('id', perfilActual.id)
      .select('*')
      .single();
    if (error) throw error;
    const perfil = data as PerfilUsuario;
    this.autenticacion.actualizarPerfilLocal(perfil);
    return perfil;
  }
}
