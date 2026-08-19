import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { PerfilUsuario } from '../../features/usuarios/interfaces/perfil-usuario';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);
  private readonly sesionSignal = signal<Session | null>(null);
  private readonly perfilSignal = signal<PerfilUsuario | null>(null);
  private inicializacion: Promise<void> | null = null;

  readonly sesion = this.sesionSignal.asReadonly();
  readonly perfil = this.perfilSignal.asReadonly();
  readonly autenticado = computed(() => this.sesionSignal() !== null);

  constructor() {
    this.supabase.auth.onAuthStateChange((_evento, sesion) => {
      this.sesionSignal.set(sesion);
      if (!sesion) this.perfilSignal.set(null);
    });
  }

  async inicializar(): Promise<void> {
    if (!this.inicializacion) {
      this.inicializacion = this.cargarSesion();
    }
    return this.inicializacion;
  }

  private async cargarSesion(): Promise<void> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    this.sesionSignal.set(data.session);
    if (data.session) await this.cargarPerfil(data.session.user.id);
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email: correo, password: contrasena });
    if (error || !data.session) throw error ?? new Error('No se pudo crear la sesión.');
    this.sesionSignal.set(data.session);
    await this.cargarPerfil(data.user.id);
  }
  async solicitarRecuperacion(correo:string):Promise<void>{const {error}=await this.supabase.auth.resetPasswordForEmail(correo,{redirectTo:`${window.location.origin}/restablecer-contrasena`});if(error)throw error;}
  async actualizarContrasena(contrasena:string):Promise<void>{const {data,error:sesionError}=await this.supabase.auth.getSession();if(sesionError||!data.session)throw sesionError??new Error('RECUPERACION_INVALIDA');const {error}=await this.supabase.auth.updateUser({password:contrasena,data:{acceso_pendiente:false}});if(error)throw error;await this.supabase.auth.signOut();this.sesionSignal.set(null);this.perfilSignal.set(null);}

  async cargarPerfil(id?: string): Promise<PerfilUsuario> {
    const usuarioId = id ?? this.sesionSignal()?.user.id;
    if (!usuarioId) throw new Error('No existe una sesión activa.');
    const { data, error } = await this.supabase.from('perfil').select('*').eq('id', usuarioId).single();
    if (error) throw error;
    const perfil = data as PerfilUsuario;
    this.perfilSignal.set(perfil);
    return perfil;
  }

  actualizarPerfilLocal(perfil: PerfilUsuario): void { this.perfilSignal.set(perfil); }

  async cerrarSesion(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    this.sesionSignal.set(null);
    this.perfilSignal.set(null);
    await this.router.navigateByUrl('/login');
    if (error) throw error;
  }
}
