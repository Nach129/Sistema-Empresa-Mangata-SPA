import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RolUsuario } from '../enums/rol-usuario';

const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATRON_TELEFONO_NORMALIZADO = /^\+569\d{8}$/;

export type CampoNormalizableUsuario = 'nombre' | 'apellido' | 'rut' | 'correo' | 'telefono';

export interface DatosFormularioUsuario {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  telefono: string;
}

export function normalizarNombre(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

export function normalizarRut(valor: string): string {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{1,8}[\dK]$/.test(limpio)) return valor.trim().toUpperCase();
  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.slice(-1);
  const cuerpoFormateado = Number(cuerpo).toLocaleString('es-CL');
  return `${cuerpoFormateado}-${verificador}`;
}

export function normalizarTelefono(valor: string): string {
  const limpio = valor.trim().replace(/[\s()-]/g, '');
  if (/^9\d{8}$/.test(limpio)) return `+56${limpio}`;
  if (/^569\d{8}$/.test(limpio)) return `+${limpio}`;
  return limpio;
}

export function normalizarCorreo(valor: string): string {
  return valor.trim().toLowerCase();
}

export function normalizarCampoUsuario(campo: CampoNormalizableUsuario, valor: string): string {
  if (campo === 'nombre' || campo === 'apellido') return normalizarNombre(valor);
  if (campo === 'rut') return normalizarRut(valor);
  if (campo === 'telefono') return normalizarTelefono(valor);
  return normalizarCorreo(valor);
}

export function normalizarDatosFormularioUsuario<T extends DatosFormularioUsuario>(datos: T): T {
  return {
    ...datos,
    nombre: normalizarNombre(datos.nombre),
    apellido: normalizarNombre(datos.apellido),
    rut: normalizarRut(datos.rut),
    correo: normalizarCorreo(datos.correo),
    telefono: normalizarTelefono(datos.telefono),
  };
}

export function nombrePersonaValidator(control: AbstractControl<string>): ValidationErrors | null {
  return !control.value || PATRON_NOMBRE.test(control.value) ? null : { nombrePersona: true };
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

export function rutChilenoValidator(control: AbstractControl<string>): ValidationErrors | null {
  return !control.value || rutChilenoValido(control.value) ? null : { rutChileno: true };
}

export function telefonoChilenoValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) return null;
  return PATRON_TELEFONO_NORMALIZADO.test(normalizarTelefono(control.value)) ? null : { telefonoChileno: true };
}

export function correoUsuarioValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) return null;
  return control.value === control.value.trim() && control.value.length <= 150 && PATRON_CORREO.test(control.value)
    ? null : { correoUsuario: true };
}

export function rolUsuarioValidator(control: AbstractControl<string>): ValidationErrors | null {
  return Object.values(RolUsuario).includes(control.value as RolUsuario) ? null : { rolUsuario: true };
}

export function contrasenaUsuarioValidator(control: AbstractControl<string>): ValidationErrors | null {
  return /[A-Za-z]/.test(control.value) && /\d/.test(control.value) ? null : { contrasenaUsuario: true };
}

export function validadoresNombrePersona(): ValidatorFn[] {
  return [Validators.required, Validators.minLength(2), Validators.maxLength(100), nombrePersonaValidator];
}

export function validadoresRutUsuario(): ValidatorFn[] {
  return [Validators.required, rutChilenoValidator];
}

export function validadoresCorreoUsuario(): ValidatorFn[] {
  return [Validators.required, Validators.maxLength(150), correoUsuarioValidator];
}

export function validadoresTelefonoUsuario(): ValidatorFn[] {
  return [Validators.maxLength(20), telefonoChilenoValidator];
}

export function validadoresRolUsuario(): ValidatorFn[] {
  return [Validators.required, rolUsuarioValidator];
}

export function validadoresContrasenaUsuario(): ValidatorFn[] {
  return [Validators.required, Validators.minLength(8), contrasenaUsuarioValidator];
}
