import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { administradorGuard } from './core/guards/administrador.guard';
import { gestorProductosGuard } from './core/guards/gestor-productos.guard';
import { gestorPedidosGuard } from './core/guards/gestor-pedidos.guard';
import { operadorPedidosGuard } from './core/guards/operador-pedidos.guard';
import { reporteGuard } from './core/guards/reporte.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/usuarios/pages/inicio-sesion/inicio-sesion.component').then(m => m.InicioSesionComponent) },
  { path: 'recuperar-contrasena', loadComponent: () => import('./features/usuarios/pages/recuperar-contrasena/recuperar-contrasena.component').then(m => m.RecuperarContrasenaComponent) },
  { path: 'restablecer-contrasena', loadComponent: () => import('./features/usuarios/pages/restablecer-contrasena/restablecer-contrasena.component').then(m => m.RestablecerContrasenaComponent) },
  {
    path: '', canActivate: [authGuard], loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'perfil', loadComponent: () => import('./features/usuarios/pages/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: 'usuarios', canActivate: [administradorGuard], loadComponent: () => import('./features/usuarios/pages/gestionar-usuarios/gestionar-usuarios.component').then(m => m.GestionarUsuariosComponent) },
      { path: 'usuarios/nuevo', canActivate: [administradorGuard], loadComponent: () => import('./features/usuarios/pages/registro-usuario/registro-usuario.component').then(m => m.RegistroUsuarioComponent) },
      { path: 'usuarios/:id/editar', canActivate: [administradorGuard], loadComponent: () => import('./features/usuarios/pages/editar-usuario/editar-usuario.component').then(m => m.EditarUsuarioComponent) },
      { path: 'productos', loadComponent: () => import('./features/productos/pages/productos/productos.component').then(m => m.ProductosComponent) },
      { path: 'productos/nuevo', canActivate: [gestorProductosGuard], loadComponent: () => import('./features/productos/pages/nuevo-producto/nuevo-producto.component').then(m => m.NuevoProductoComponent) },
      { path: 'productos/:id/editar', canActivate: [gestorProductosGuard], loadComponent: () => import('./features/productos/pages/editar-producto/editar-producto.component').then(m => m.EditarProductoComponent) },
      { path: 'pedidos', loadComponent: () => import('./features/pedidos/pages/pedidos/pedidos.component').then(m => m.PedidosComponent) },
      { path: 'pedidos/nuevo', canActivate: [gestorPedidosGuard], loadComponent: () => import('./features/pedidos/pages/nuevo-pedido/nuevo-pedido.component').then(m => m.NuevoPedidoComponent) },
      { path: 'pedidos/:id/editar', canActivate: [gestorPedidosGuard], loadComponent: () => import('./features/pedidos/pages/editar-pedido/editar-pedido.component').then(m => m.EditarPedidoComponent) },
      { path: 'pedidos/:id', loadComponent: () => import('./features/pedidos/pages/detalle-pedido/detalle-pedido.component').then(m => m.DetallePedidoComponent) },
      { path: 'clientes/:id/pedidos', canActivate: [operadorPedidosGuard], loadComponent: () => import('./features/pedidos/pages/historial-cliente/historial-cliente.component').then(m => m.HistorialClienteComponent) },
      { path: 'reportes', canActivate: [reporteGuard], loadComponent: () => import('./features/reportes/pages/reportes/reportes.component').then(m => m.ReportesComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
    ],
  },
  { path: '**', redirectTo: 'perfil' },
];
