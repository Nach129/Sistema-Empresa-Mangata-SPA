import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { administradorGuard } from './core/guards/administrador.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/usuarios/pages/inicio-sesion/inicio-sesion.component').then(m => m.InicioSesionComponent) },
  {
    path: '', canActivate: [authGuard], loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'perfil', loadComponent: () => import('./features/usuarios/pages/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: 'usuarios', pathMatch: 'full', redirectTo: 'usuarios/nuevo' },
      { path: 'usuarios/nuevo', canActivate: [administradorGuard], loadComponent: () => import('./features/usuarios/pages/registro-usuario/registro-usuario.component').then(m => m.RegistroUsuarioComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
    ],
  },
  { path: '**', redirectTo: 'perfil' },
];
