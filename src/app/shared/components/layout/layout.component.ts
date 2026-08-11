import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { RolUsuario } from '../../enums/rol-usuario';

@Component({ selector: 'app-layout', imports: [RouterOutlet, RouterLink, RouterLinkActive], templateUrl: './layout.component.html', styleUrl: './layout.component.css' })
export class LayoutComponent {
  readonly autenticacion = inject(AutenticacionService);
  readonly cerrando = signal(false);
  readonly RolUsuario = RolUsuario;

  async cerrarSesion(): Promise<void> {
    if (this.cerrando()) return;
    this.cerrando.set(true);
    try { await this.autenticacion.cerrarSesion(); } finally { this.cerrando.set(false); }
  }
}
