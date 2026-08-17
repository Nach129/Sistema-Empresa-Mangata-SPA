import { EstadoPedido } from '../../../shared/enums/estado-pedido';
import { completarEstados, etiquetaPeriodo, formatearClp, rangoFechasValido } from './reporte-utilidades';

describe('utilidades de reportes', () => {
  it('completa todos los estados y conserva las cantidades recibidas', () => {
    const resultado = completarEstados([{ estado: EstadoPedido.Entregado, cantidad: 3 }]);

    expect(resultado.length).toBe(Object.values(EstadoPedido).length);
    expect(resultado.find((item) => item.estado === EstadoPedido.Entregado)?.cantidad).toBe(3);
    expect(resultado.find((item) => item.estado === EstadoPedido.Cancelado)?.cantidad).toBe(0);
  });

  it('rechaza un rango cuya fecha inicial sea posterior a la final', () => {
    expect(rangoFechasValido('2026-08-18', '2026-08-17')).toBe(false);
    expect(rangoFechasValido('2026-08-17', '2026-08-17')).toBe(true);
  });

  it('presenta valores y periodos en formato chileno', () => {
    expect(formatearClp(15000)).toContain('15.000');
    expect(etiquetaPeriodo('2026-08').toLowerCase()).toContain('2026');
  });
});
