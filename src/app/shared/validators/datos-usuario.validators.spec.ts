import { FormControl } from '@angular/forms';
import {
  correoUsuarioValidator,
  nombrePersonaValidator,
  normalizarNombre,
  normalizarRut,
  normalizarTelefono,
  rutChilenoValido,
  telefonoChilenoValidator,
} from './datos-usuario.validators';

describe('validaciones compartidas de usuario', () => {
  it.each(['Andrea', 'José Andrés', 'María José', 'Álvaro', 'Pérez González', 'Muñoz', 'De la Fuente'])('acepta nombres y apellidos válidos: %s', (valor) => {
    expect(nombrePersonaValidator(new FormControl(valor, { nonNullable: true }))).toBeNull();
  });

  it.each(['Andrea123', '123', 'Andrea@', 'Andrea_', ' Andrea', 'Andrea  María', 'Perez123'])('rechaza nombres y apellidos inválidos o pegados: %s', (valor) => {
    expect(nombrePersonaValidator(new FormControl(valor, { nonNullable: true }))).not.toBeNull();
  });

  it('normaliza espacios de nombres sin alterar letras españolas', () => {
    expect(normalizarNombre('  María   José  ')).toBe('María José');
  });

  it.each(['21.349.954-8', '21349954-8', '12.345.678-5', '6.000.000-K'])('valida RUT chileno mediante módulo 11: %s', (rut) => {
    expect(rutChilenoValido(rut)).toBe(true);
  });

  it.each(['abc', '11.111.111-X', '123', '11.111.111-2', '12.345.678-K'])('rechaza RUT inválido: %s', (rut) => {
    expect(rutChilenoValido(rut)).toBe(false);
  });

  it('normaliza RUT sin puntos y K minúscula al formato visual estándar', () => {
    expect(normalizarRut('6000000-k')).toBe('6.000.000-K');
  });

  it.each(['912345678', '+56912345678', '56912345678', '+56 9 1234 5678'])('acepta y normaliza teléfonos chilenos: %s', (telefono) => {
    expect(telefonoChilenoValidator(new FormControl(telefono, { nonNullable: true }))).toBeNull();
    expect(normalizarTelefono(telefono)).toBe('+56912345678');
  });

  it.each(['abcdef', '9abc5678', '91234'])('rechaza teléfonos inválidos o pegados: %s', (telefono) => {
    expect(telefonoChilenoValidator(new FormControl(telefono, { nonNullable: true }))).not.toBeNull();
  });

  it.each(['usuario@gmail.com', 'admin@mangata.cl'])('acepta correos válidos: %s', (correo) => {
    expect(correoUsuarioValidator(new FormControl(correo, { nonNullable: true }))).toBeNull();
  });

  it.each(['usuario', 'usuario@', '@correo.cl', 'usuario correo@gmail.com', ' usuario@gmail.com '])('rechaza correos inválidos o pegados: %s', (correo) => {
    expect(correoUsuarioValidator(new FormControl(correo, { nonNullable: true }))).not.toBeNull();
  });
});
