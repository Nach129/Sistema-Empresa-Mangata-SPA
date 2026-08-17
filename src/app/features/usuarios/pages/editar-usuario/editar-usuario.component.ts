import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
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
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    rut: ['', [Validators.required, Validators.pattern(/^\d{1,2}\.?(?:\d{3}\.?){2}-[\dkK]$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(20), Validators.pattern(/^$|^[+\d][\d\s()-]{7,19}$/)]],
    rol: ['', [Validators.required, Validators.pattern(/^(ADMINISTRADOR|TRABAJADOR|CLIENTE)$/)]],
  });

  constructor() { void this.cargar(); }

  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.guardando()) return;
    this.guardando.set(true); this.mensajeError.set('');
    try {
      const valor = this.formulario.getRawValue();
      await this.usuarios.actualizarUsuario({ id: this.id, nombre: valor.nombre.trim(), apellido: valor.apellido.trim(), rut: valor.rut.trim(), correo: valor.correo.trim().toLowerCase(), telefono: valor.telefono.trim() || null, rol: valor.rol as RolUsuario });
      await this.router.navigate(['/usuarios'], { state: { mensaje: 'Usuario actualizado correctamente.' } });
    } catch (error) { this.mensajeError.set(mensajeErrorAdministracion(error)); }
    finally { this.guardando.set(false); }
  }

  private async cargar(): Promise<void> {
    try {
      const usuario = await this.usuarios.obtenerUsuario(this.id);
      this.formulario.setValue({ nombre: usuario.nombre, apellido: usuario.apellido, rut: usuario.rut, correo: usuario.correo, telefono: usuario.telefono ?? '', rol: usuario.rol });
    } catch (error) { this.mensajeError.set(mensajeErrorAdministracion(error)); }
    finally { this.cargando.set(false); }
  }
}
