import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion.service';

export const authGuard: CanActivateFn = async (_ruta, estado) => {
  const autenticacion = inject(AutenticacionService);
  const router = inject(Router);
  try { await autenticacion.inicializar(); } catch { return router.createUrlTree(['/login']); }
  return autenticacion.autenticado() ? true : router.createUrlTree(['/login'], { queryParams: { retorno: estado.url } });
};
