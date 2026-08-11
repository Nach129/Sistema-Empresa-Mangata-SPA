import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';

@Component({
  selector: 'app-inicio-sesion',
  imports: [ReactiveFormsModule],
  templateUrl: './inicio-sesion.component.html',
  styleUrl: './inicio-sesion.component.css',
})
export class InicioSesionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  readonly cargando = signal(false);
  readonly mostrarContrasena = signal(false);
  readonly mensajeError = signal('');

  readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });

  async ingresar(): Promise<void> {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.cargando()) return;
    this.cargando.set(true); this.mensajeError.set('');
    try {
      const { correo, contrasena } = this.formulario.getRawValue();
      await this.autenticacion.iniciarSesion(correo.trim().toLowerCase(), contrasena);
      const retorno = this.ruta.snapshot.queryParamMap.get('retorno');
      await this.router.navigateByUrl(retorno?.startsWith('/') ? retorno : '/perfil');
    } catch {
      this.mensajeError.set('No fue posible iniciar sesión. Verifica tus credenciales.');
    } finally { this.cargando.set(false); }
  }
}
