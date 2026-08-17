import { RolUsuario } from '../../../shared/enums/rol-usuario';
import { PerfilUsuario } from '../interfaces/perfil-usuario';
import { filtrarUsuarios, normalizarBusquedaUsuario, puedeEliminarUsuario } from './filtro-usuarios';

const usuarios: PerfilUsuario[] = [
  { id: '1', nombre: 'José', apellido: 'Pérez', rut: '12.345.678-9', correo: 'jose@mangata.cl', telefono: null, rol: RolUsuario.Administrador, created_at: '', updated_at: '' },
  { id: '2', nombre: 'Camila', apellido: 'Soto', rut: '15.678.912-3', correo: 'camila@mangata.cl', telefono: null, rol: RolUsuario.Cliente, created_at: '', updated_at: '' },
];

describe('filtro de usuarios', () => {
  it('busca por nombre completo sin distinguir mayúsculas ni acentos', () => {
    expect(filtrarUsuarios(usuarios, '  JOSE   PEREZ ', '')).toEqual([usuarios[0]]);
    expect(normalizarBusquedaUsuario(' José ')).toBe('jose');
  });

  it('busca por RUT o correo', () => {
    expect(filtrarUsuarios(usuarios, '15.678.912-3', '')).toEqual([usuarios[1]]);
    expect(filtrarUsuarios(usuarios, 'CAMILA@MANGATA.CL', '')).toEqual([usuarios[1]]);
  });

  it('combina búsqueda y rol', () => {
    expect(filtrarUsuarios(usuarios, 'mangata', RolUsuario.Cliente)).toEqual([usuarios[1]]);
    expect(filtrarUsuarios(usuarios, 'Camila', RolUsuario.Administrador)).toEqual([]);
  });

  it('impide solicitar la eliminación de la cuenta autenticada', () => {
    expect(puedeEliminarUsuario('1', '1')).toBe(false);
    expect(puedeEliminarUsuario('2', '1')).toBe(true);
    expect(puedeEliminarUsuario('2', undefined)).toBe(false);
  });
});
