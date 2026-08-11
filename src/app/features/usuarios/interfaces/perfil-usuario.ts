import { RolUsuario } from '../../../shared/enums/rol-usuario';

export interface PerfilUsuario {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  created_at: string;
  updated_at: string;
}

export interface DatosPerfilActualizables {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  telefono: string | null;
}

export interface NuevoUsuario extends DatosPerfilActualizables {
  rol: RolUsuario;
  contrasena: string;
}
