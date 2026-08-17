import { EstadoPedido } from '../../../shared/enums/estado-pedido';
import { ReporteGeneral } from '../interfaces/reporte';
import { ReportePdfService, formatearFechaReporte, nombreArchivoReporte } from './reporte-pdf.service';

function crearReporte(cantidadProductos = 2): ReporteGeneral {
  return {
    indicadores: { totalPedidos: 4, pedidosPendientes: 0, pedidosEntregados: 3, totalVentas: 103500 },
    pedidosPorEstado: Object.values(EstadoPedido).map((estado, indice) => ({ estado, cantidad: indice === 4 ? 3 : indice === 5 ? 1 : 0 })),
    productosMasSolicitados: Array.from({ length: cantidadProductos }, (_, indice) => ({ productoId: indice + 1, nombre: `Producto corporativo ${indice + 1}`, cantidad: cantidadProductos - indice })),
    ventasPorMes: [{ periodo: '2026-08', total: 103500 }],
    productosFiltro: [],
  };
}

describe('ReportePdfService', () => {
  const servicio = new ReportePdfService();

  it('genera un documento PDF válido para un periodo con datos', () => {
    const documento = servicio.crearDocumento(crearReporte(), '2026-08-01', '2026-08-31');
    const contenido = documento.output('arraybuffer');

    expect(contenido.byteLength).toBeGreaterThan(1000);
    expect(documento.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('genera el PDF sin fallar para un día sin datos', () => {
    const reporte = crearReporte(0);
    reporte.indicadores = { totalPedidos: 0, pedidosPendientes: 0, pedidosEntregados: 0, totalVentas: 0 };
    reporte.productosMasSolicitados = [];
    reporte.ventasPorMes = [];

    expect(() => servicio.crearDocumento(reporte, '2030-01-01', '2030-01-01')).not.toThrow();
  });

  it('pagina una tabla extensa de productos', () => {
    const documento = servicio.crearDocumento(crearReporte(80), '2026-01-01', '2026-12-31');
    expect(documento.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('construye un nombre descriptivo y presenta la fecha en es-CL', () => {
    expect(nombreArchivoReporte('2026-08-01', '2026-08-31')).toBe('reporte-mangata-2026-08-01-a-2026-08-31.pdf');
    expect(formatearFechaReporte('2026-08-01')).toBe('01-08-2026');
  });
});
