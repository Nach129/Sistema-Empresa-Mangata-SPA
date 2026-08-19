export const ROLES_USUARIO = ['ADMINISTRADOR', 'TRABAJADOR', 'CLIENTE'] as const;
export type RolUsuarioServidor = typeof ROLES_USUARIO[number];

const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATRON_TELEFONO = /^\+569\d{8}$/;

export interface DatosPersonalesServidor {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  telefono: string | null;
}

export function normalizarNombre(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

export function normalizarRut(valor: string): string {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{1,8}[\dK]$/.test(limpio)) return valor.trim().toUpperCase();
  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.slice(-1);
  const grupos: string[] = [];
  for (let fin = cuerpo.length; fin > 0; fin -= 3) grupos.unshift(cuerpo.slice(Math.max(0, fin - 3), fin));
  return `${grupos.join('.')}-${verificador}`;
}

export function normalizarTelefono(valor: string | null | undefined): string | null {
  if (!valor?.trim()) return null;
  const limpio = valor.trim().replace(/[\s()-]/g, '');
  if (/^9\d{8}$/.test(limpio)) return `+56${limpio}`;
  if (/^569\d{8}$/.test(limpio)) return `+${limpio}`;
  return limpio;
}

export function normalizarDatosPersonales(datos: DatosPersonalesServidor): DatosPersonalesServidor {
  return {
    nombre: normalizarNombre(datos.nombre),
    apellido: normalizarNombre(datos.apellido),
    rut: normalizarRut(datos.rut),
    correo: datos.correo.trim().toLowerCase(),
    telefono: normalizarTelefono(datos.telefono),
  };
}

export function rutChilenoValido(valor: string): boolean {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.slice(-1);
  let suma = 0;
  let multiplicador = 2;
  for (let indice = cuerpo.length - 1; indice >= 0; indice--) {
    suma += Number(cuerpo[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resultado = 11 - (suma % 11);
  const esperado = resultado === 11 ? '0' : resultado === 10 ? 'K' : String(resultado);
  return verificador === esperado;
}

export function datosPersonalesValidos(datos: DatosPersonalesServidor): boolean {
  const normalizados = normalizarDatosPersonales(datos);
  return normalizados.nombre.length >= 2 && normalizados.nombre.length <= 100 && PATRON_NOMBRE.test(normalizados.nombre)
    && normalizados.apellido.length >= 2 && normalizados.apellido.length <= 100 && PATRON_NOMBRE.test(normalizados.apellido)
    && rutChilenoValido(normalizados.rut)
    && normalizados.correo.length <= 150 && PATRON_CORREO.test(normalizados.correo)
    && (normalizados.telefono === null || PATRON_TELEFONO.test(normalizados.telefono));
}

export function datosPersonalesModificadosValidos(nuevos: DatosPersonalesServidor, actuales: DatosPersonalesServidor): boolean {
  const datosNuevos = normalizarDatosPersonales(nuevos);
  const datosActuales = normalizarDatosPersonales(actuales);
  return (datosNuevos.nombre === datosActuales.nombre || (datosNuevos.nombre.length >= 2 && datosNuevos.nombre.length <= 100 && PATRON_NOMBRE.test(datosNuevos.nombre)))
    && (datosNuevos.apellido === datosActuales.apellido || (datosNuevos.apellido.length >= 2 && datosNuevos.apellido.length <= 100 && PATRON_NOMBRE.test(datosNuevos.apellido)))
    && (datosNuevos.rut === datosActuales.rut || rutChilenoValido(datosNuevos.rut))
    && (datosNuevos.correo === datosActuales.correo || (datosNuevos.correo.length <= 150 && PATRON_CORREO.test(datosNuevos.correo)))
    && (datosNuevos.telefono === datosActuales.telefono || datosNuevos.telefono === null || PATRON_TELEFONO.test(datosNuevos.telefono));
}

export function rolUsuarioValido(valor: unknown): valor is RolUsuarioServidor {
  return typeof valor === 'string' && ROLES_USUARIO.includes(valor as RolUsuarioServidor);
}
