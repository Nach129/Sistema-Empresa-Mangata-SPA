import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../../shared/enums/rol-usuario';
import { AutenticacionService } from '../services/autenticacion.service';

export function puedeAccederReportes(rol: RolUsuario | undefined): boolean {
  return rol === RolUsuario.Administrador;
}

export const reporteGuard: CanActivateFn = async () => {
  const autenticacion = inject(AutenticacionService);
  const router = inject(Router);
  try {
    await autenticacion.inicializar();
    if (!autenticacion.perfil() && autenticacion.autenticado()) await autenticacion.cargarPerfil();
  } catch {
    return router.createUrlTree(['/login']);
  }
  return puedeAccederReportes(autenticacion.perfil()?.rol) ? true : router.createUrlTree(['/perfil']);
};
