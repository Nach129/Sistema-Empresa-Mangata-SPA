import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({ selector: 'app-perfil', imports: [ReactiveFormsModule], templateUrl: './perfil.component.html', styleUrl: '../formulario-usuario.css' })
export class PerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly usuarios = inject(UsuarioService);
  readonly cargando = signal(true); readonly guardando = signal(false);
  readonly mensajeError = signal(''); readonly mensajeExito = signal('');
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]], apellido: ['', [Validators.required, Validators.maxLength(100)]],
    rut: ['', [Validators.required, Validators.pattern(/^\d{1,2}\.?(?:\d{3}\.?){2}-[\dkK]$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(20), Validators.pattern(/^$|^[+\d][\d\s()-]{7,19}$/)]], rol: [{ value: '', disabled: true }],
  });

  constructor() { void this.cargar(); }
  private async cargar(): Promise<void> {
    try { const p = await this.autenticacion.cargarPerfil(); this.formulario.patchValue({ nombre: p.nombre, apellido: p.apellido, rut: p.rut, correo: p.correo, telefono: p.telefono ?? '', rol: p.rol }); }
    catch { this.mensajeError.set('No fue posible cargar la información.'); } finally { this.cargando.set(false); }
  }
  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched(); if (this.formulario.invalid || this.guardando()) return;
    this.guardando.set(true); this.mensajeError.set(''); this.mensajeExito.set('');
    try { const { nombre, apellido, rut, correo, telefono } = this.formulario.getRawValue(); await this.usuarios.actualizarPerfil({ nombre: nombre.trim(), apellido: apellido.trim(), rut: rut.trim(), correo, telefono: telefono.trim() || null }); this.mensajeExito.set('Perfil actualizado correctamente.'); }
    catch { this.mensajeError.set('No fue posible actualizar el perfil. Verifica que el correo y el RUT no estén registrados.'); } finally { this.guardando.set(false); }
  }
}
