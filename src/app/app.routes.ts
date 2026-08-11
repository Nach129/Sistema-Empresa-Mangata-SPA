import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { administradorGuard } from './core/guards/administrador.guard';
import { gestorProductosGuard } from './core/guards/gestor-productos.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/usuarios/pages/inicio-sesion/inicio-sesion.component').then(m => m.InicioSesionComponent) },
  {
    path: '', canActivate: [authGuard], loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'perfil', loadComponent: () => import('./features/usuarios/pages/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: 'usuarios', pathMatch: 'full', redirectTo: 'usuarios/nuevo' },
      { path: 'usuarios/nuevo', canActivate: [administradorGuard], loadComponent: () => import('./features/usuarios/pages/registro-usuario/registro-usuario.component').then(m => m.RegistroUsuarioComponent) },
      { path: 'productos', loadComponent: () => import('./features/productos/pages/productos/productos.component').then(m => m.ProductosComponent) },
      { path: 'productos/nuevo', canActivate: [gestorProductosGuard], loadComponent: () => import('./features/productos/pages/nuevo-producto/nuevo-producto.component').then(m => m.NuevoProductoComponent) },
      { path: 'productos/:id/editar', canActivate: [gestorProductosGuard], loadComponent: () => import('./features/productos/pages/editar-producto/editar-producto.component').then(m => m.EditarProductoComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
    ],
  },
  { path: '**', redirectTo: 'perfil' },
];
