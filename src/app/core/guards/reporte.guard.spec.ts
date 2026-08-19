import { RolUsuario } from '../../shared/enums/rol-usuario';
import { puedeAccederReportes } from './reporte.guard';

describe('permisos de reportes', () => {
  it('permite acceder únicamente al administrador', () => {
    expect(puedeAccederReportes(RolUsuario.Administrador)).toBe(true);
    expect(puedeAccederReportes(RolUsuario.Trabajador)).toBe(false);
    expect(puedeAccederReportes(RolUsuario.Cliente)).toBe(false);
    expect(puedeAccederReportes(undefined)).toBe(false);
  });
});
