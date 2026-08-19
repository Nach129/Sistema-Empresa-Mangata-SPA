import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { CampoNormalizableUsuario, normalizarCampoUsuario, normalizarDatosFormularioUsuario, validadoresContrasenaUsuario, validadoresCorreoUsuario, validadoresNombrePersona, validadoresRolUsuario, validadoresRutUsuario, validadoresTelefonoUsuario } from '../../../../shared/validators/datos-usuario.validators';
import { UsuarioService } from '../../services/usuario.service';

@Component({ selector: 'app-registro-usuario', imports: [ReactiveFormsModule, RouterLink], templateUrl: './registro-usuario.component.html', styleUrl: '../formulario-usuario.css' })
export class RegistroUsuarioComponent {
  private readonly fb = inject(FormBuilder); private readonly usuarios = inject(UsuarioService); private readonly router = inject(Router);
  readonly roles = Object.values(RolUsuario); readonly guardando = signal(false); readonly mostrarContrasena = signal(false);
  readonly mensajeError = signal(''); readonly mensajeExito = signal('');
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', validadoresNombrePersona()], apellido: ['', validadoresNombrePersona()],
    rut: ['', validadoresRutUsuario()], correo: ['', validadoresCorreoUsuario()],
    telefono: ['', validadoresTelefonoUsuario()], rol: ['', validadoresRolUsuario()],
    contrasena: ['', validadoresContrasenaUsuario()],
  });
  async registrar(): Promise<void> {
    this.formulario.patchValue(normalizarDatosFormularioUsuario(this.formulario.getRawValue()));
    this.formulario.markAllAsTouched(); if (this.formulario.invalid || this.guardando()) return;
    this.guardando.set(true); this.mensajeError.set(''); this.mensajeExito.set('');
    try {
      const v = this.formulario.getRawValue();
      await this.usuarios.registrarUsuario({ nombre: v.nombre, apellido: v.apellido, rut: v.rut, correo: v.correo, telefono: v.telefono || null, rol: v.rol as RolUsuario, contrasena: v.contrasena });
      await this.router.navigate(['/usuarios'], { state: { mensaje: 'Usuario registrado correctamente.' } });
    } catch { this.mensajeError.set('No fue posible registrar al usuario. Verifica que el correo y el RUT no estén registrados.'); }
    finally { this.guardando.set(false); }
  }

  normalizarCampo(campo: CampoNormalizableUsuario): void {
    const control = this.formulario.controls[campo];
    control.setValue(normalizarCampoUsuario(campo, control.value));
  }
}
