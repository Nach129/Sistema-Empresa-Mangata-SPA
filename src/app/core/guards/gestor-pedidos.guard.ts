import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../../shared/enums/rol-usuario';
import { AutenticacionService } from '../services/autenticacion.service';
export const gestorPedidosGuard:CanActivateFn=async()=>{const a=inject(AutenticacionService),r=inject(Router);try{await a.inicializar();if(!a.perfil()&&a.autenticado())await a.cargarPerfil();}catch{return r.createUrlTree(['/login']);}return a.perfil()?.rol===RolUsuario.Administrador?true:r.createUrlTree(['/pedidos']);};
