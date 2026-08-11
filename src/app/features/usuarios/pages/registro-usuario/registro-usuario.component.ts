import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { UsuarioService } from '../../services/usuario.service';

@Component({ selector: 'app-registro-usuario', imports: [ReactiveFormsModule], templateUrl: './registro-usuario.component.html', styleUrl: '../formulario-usuario.css' })
export class RegistroUsuarioComponent {
  private readonly fb = inject(FormBuilder); private readonly usuarios = inject(UsuarioService);
  readonly roles = Object.values(RolUsuario); readonly guardando = signal(false); readonly mostrarContrasena = signal(false);
  readonly mensajeError = signal(''); readonly mensajeExito = signal('');
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]], apellido: ['', [Validators.required, Validators.maxLength(100)]],
    rut: ['', [Validators.required, Validators.pattern(/^\d{1,2}\.?(?:\d{3}\.?){2}-[\dkK]$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(20), Validators.pattern(/^$|^[+\d][\d\s()-]{7,19}$/)]],
    rol: ['', [Validators.required, Validators.pattern(/^(ADMINISTRADOR|TRABAJADOR|CLIENTE)$/)]],
    contrasena: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
  });
  async registrar(): Promise<void> {
    this.formulario.markAllAsTouched(); if (this.formulario.invalid || this.guardando()) return;
    this.guardando.set(true); this.mensajeError.set(''); this.mensajeExito.set('');
    try {
      const v = this.formulario.getRawValue();
      await this.usuarios.registrarUsuario({ nombre: v.nombre.trim(), apellido: v.apellido.trim(), rut: v.rut.trim(), correo: v.correo.trim().toLowerCase(), telefono: v.telefono.trim() || null, rol: v.rol as RolUsuario, contrasena: v.contrasena });
      this.mensajeExito.set('Usuario registrado correctamente.'); this.formulario.reset();
    } catch { this.mensajeError.set('No fue posible registrar al usuario. Verifica que el correo y el RUT no estén registrados.'); }
    finally { this.guardando.set(false); }
  }
}
