import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../../shared/enums/rol-usuario';
import { AutenticacionService } from '../services/autenticacion.service';

export const gestorProductosGuard: CanActivateFn = async () => {
  const autenticacion = inject(AutenticacionService);
  const router = inject(Router);

  try {
    await autenticacion.inicializar();
    if (!autenticacion.perfil() && autenticacion.autenticado()) {
      await autenticacion.cargarPerfil();
    }
  } catch {
    return router.createUrlTree(['/login']);
  }

  const rol = autenticacion.perfil()?.rol;
  return rol === RolUsuario.Administrador
    ? true
    : router.createUrlTree(['/productos']);
};
