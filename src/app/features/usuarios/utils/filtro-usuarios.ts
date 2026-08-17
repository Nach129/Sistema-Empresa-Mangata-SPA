import { RolUsuario } from '../../../shared/enums/rol-usuario';
import { PerfilUsuario } from '../interfaces/perfil-usuario';

export function normalizarBusquedaUsuario(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

export function filtrarUsuarios(usuarios: PerfilUsuario[], busqueda: string, rol: RolUsuario | ''): PerfilUsuario[] {
  const termino = normalizarBusquedaUsuario(busqueda);
  return usuarios.filter((usuario) => {
    const contenido = normalizarBusquedaUsuario(`${usuario.nombre} ${usuario.apellido} ${usuario.rut} ${usuario.correo}`);
    return (!termino || contenido.includes(termino)) && (!rol || usuario.rol === rol);
  });
}

export function puedeEliminarUsuario(usuarioId: string, usuarioActualId: string | undefined): boolean {
  return Boolean(usuarioActualId) && usuarioId !== usuarioActualId;
}
