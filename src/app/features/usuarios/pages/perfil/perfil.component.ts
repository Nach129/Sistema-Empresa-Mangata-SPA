import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { CampoNormalizableUsuario, DatosFormularioUsuario, normalizarCampoUsuario, normalizarDatosFormularioUsuario, validadoresCorreoUsuario, validadoresNombrePersona, validadoresRutUsuario, validadoresTelefonoUsuario } from '../../../../shared/validators/datos-usuario.validators';
import { UsuarioService } from '../../services/usuario.service';

@Component({ selector: 'app-perfil', imports: [ReactiveFormsModule], templateUrl: './perfil.component.html', styleUrl: '../formulario-usuario.css' })
export class PerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly usuarios = inject(UsuarioService);
  readonly cargando = signal(true); readonly guardando = signal(false);
  readonly mensajeError = signal(''); readonly mensajeExito = signal('');
  private valoresIniciales: (DatosFormularioUsuario & { rol: string }) | null = null;
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', validadoresNombrePersona()], apellido: ['', validadoresNombrePersona()],
    rut: ['', validadoresRutUsuario()], correo: ['', validadoresCorreoUsuario()],
    telefono: ['', validadoresTelefonoUsuario()], rol: [{ value: '', disabled: true }],
  });

  constructor() { void this.cargar(); }
  private async cargar(): Promise<void> {
    try {
      const p = await this.autenticacion.cargarPerfil();
      const valores = normalizarDatosFormularioUsuario({ nombre: p.nombre, apellido: p.apellido, rut: p.rut, correo: p.correo, telefono: p.telefono ?? '', rol: p.rol });
      this.valoresIniciales = valores;
      this.formulario.setValue(valores);
      this.formulario.markAsPristine();
    }
    catch { this.mensajeError.set('No fue posible cargar la información.'); } finally { this.cargando.set(false); }
  }
  async guardar(): Promise<void> {
    this.formulario.patchValue(normalizarDatosFormularioUsuario(this.formulario.getRawValue()));
    this.formulario.markAllAsTouched(); if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true); this.mensajeError.set(''); this.mensajeExito.set('');
    try { const { nombre, apellido, rut, correo, telefono } = this.formulario.getRawValue(); await this.usuarios.actualizarPerfil({ nombre, apellido, rut, correo, telefono: telefono || null }); this.mensajeExito.set('Perfil actualizado correctamente.'); }
    catch { this.mensajeError.set('No fue posible actualizar el perfil. Verifica que el correo y el RUT no estén registrados.'); } finally { this.guardando.set(false); }
  }

  normalizarCampo(campo: CampoNormalizableUsuario): void {
    const control = this.formulario.controls[campo];
    control.setValue(normalizarCampoUsuario(campo, control.value));
  }

  campoModificado(campo: keyof DatosFormularioUsuario): boolean {
    if (!this.valoresIniciales) return false;
    const actuales = normalizarDatosFormularioUsuario(this.formulario.getRawValue());
    return actuales[campo] !== this.valoresIniciales[campo];
  }

  puedeGuardar(): boolean {
    if (!this.valoresIniciales) return false;
    const campos = ['nombre', 'apellido', 'rut', 'correo', 'telefono'] as const;
    const modificados = campos.filter((campo) => this.campoModificado(campo));
    return modificados.length > 0 && modificados.every((campo) => this.formulario.controls[campo].valid);
  }
}
