import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { CampoNormalizableUsuario, DatosFormularioUsuario, normalizarCampoUsuario, normalizarDatosFormularioUsuario, validadoresCorreoUsuario, validadoresNombrePersona, validadoresRolUsuario, validadoresRutUsuario, validadoresTelefonoUsuario } from '../../../../shared/validators/datos-usuario.validators';
import { UsuarioService, mensajeErrorAdministracion } from '../../services/usuario.service';

@Component({ selector: 'app-editar-usuario', imports: [ReactiveFormsModule, RouterLink], templateUrl: './editar-usuario.component.html', styleUrl: '../formulario-usuario.css' })
export class EditarUsuarioComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usuarios = inject(UsuarioService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly roles = Object.values(RolUsuario);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly mensajeError = signal('');
  private valoresIniciales: (DatosFormularioUsuario & { rol: string }) | null = null;
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', validadoresNombrePersona()], apellido: ['', validadoresNombrePersona()],
    rut: ['', validadoresRutUsuario()], correo: ['', validadoresCorreoUsuario()],
    telefono: ['', validadoresTelefonoUsuario()], rol: ['', validadoresRolUsuario()],
  });

  constructor() { void this.cargar(); }

  async guardar(): Promise<void> {
    this.formulario.patchValue(normalizarDatosFormularioUsuario(this.formulario.getRawValue()));
    this.formulario.markAllAsTouched();
    if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true); this.mensajeError.set('');
    try {
      const valor = this.formulario.getRawValue();
      await this.usuarios.actualizarUsuario({ id: this.id, nombre: valor.nombre, apellido: valor.apellido, rut: valor.rut, correo: valor.correo, telefono: valor.telefono || null, rol: valor.rol as RolUsuario });
      await this.router.navigate(['/usuarios'], { state: { mensaje: 'Usuario actualizado correctamente.' } });
    } catch (error) { this.mensajeError.set(mensajeErrorAdministracion(error)); }
    finally { this.guardando.set(false); }
  }

  private async cargar(): Promise<void> {
    try {
      const usuario = await this.usuarios.obtenerUsuario(this.id);
      const valores = normalizarDatosFormularioUsuario({ nombre: usuario.nombre, apellido: usuario.apellido, rut: usuario.rut, correo: usuario.correo, telefono: usuario.telefono ?? '', rol: usuario.rol });
      this.valoresIniciales = valores;
      this.formulario.setValue(valores);
      this.formulario.markAsPristine();
    } catch (error) { this.mensajeError.set(mensajeErrorAdministracion(error)); }
    finally { this.cargando.set(false); }
  }

  normalizarCampo(campo: CampoNormalizableUsuario): void {
    const control = this.formulario.controls[campo];
    control.setValue(normalizarCampoUsuario(campo, control.value));
  }

  campoModificado(campo: keyof (DatosFormularioUsuario & { rol: string })): boolean {
    if (!this.valoresIniciales) return false;
    const actuales = normalizarDatosFormularioUsuario(this.formulario.getRawValue());
    return actuales[campo] !== this.valoresIniciales[campo];
  }

  puedeGuardar(): boolean {
    if (!this.valoresIniciales) return false;
    const campos = ['nombre', 'apellido', 'rut', 'correo', 'telefono', 'rol'] as const;
    const modificados = campos.filter((campo) => this.campoModificado(campo));
    return modificados.length > 0 && modificados.every((campo) => this.formulario.controls[campo].valid);
  }
}
