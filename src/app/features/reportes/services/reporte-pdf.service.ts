import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReporteGeneral } from '../interfaces/reporte';
import { etiquetaEstado, etiquetaPeriodo, formatearClp } from '../utils/reporte-utilidades';

const azulMangata: [number, number, number] = [31, 57, 76];
const cobreMangata: [number, number, number] = [189, 123, 70];
type DocumentoConAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

export function nombreArchivoReporte(desde: string, hasta: string): string {
  return `reporte-mangata-${desde}-a-${hasta}.pdf`;
}

export function formatearFechaReporte(fecha: string): string {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${fecha}T00:00:00Z`));
}

@Injectable({ providedIn: 'root' })
export class ReportePdfService {
  descargar(reporte: ReporteGeneral, desde: string, hasta: string): void {
    this.crearDocumento(reporte, desde, hasta).save(nombreArchivoReporte(desde, hasta));
  }

  crearDocumento(reporte: ReporteGeneral, desde: string, hasta: string): jsPDF {
    const documento = new jsPDF({ unit: 'mm', format: 'a4' });
    this.agregarEncabezado(documento, desde, hasta);
    this.agregarResumen(documento, reporte);

    autoTable(documento, {
      startY: 79,
      head: [['PEDIDOS POR ESTADO', 'CANTIDAD']],
      body: reporte.pedidosPorEstado.map((item) => [etiquetaEstado(item.estado), item.cantidad.toString()]),
      theme: 'grid',
      headStyles: { fillColor: azulMangata, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', cellWidth: 35 } },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 15, right: 15, bottom: 18 },
    });

    autoTable(documento, {
      startY: this.siguientePosicion(documento, 8),
      head: [['PRODUCTOS MÁS SOLICITADOS', 'UNIDADES']],
      body: reporte.productosMasSolicitados.length
        ? reporte.productosMasSolicitados.map((item) => [item.nombre, item.cantidad.toString()])
        : [['Sin productos solicitados en el periodo', '—']],
      theme: 'striped',
      headStyles: { fillColor: azulMangata, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [244, 247, 249] },
      columnStyles: { 1: { halign: 'right', cellWidth: 35 } },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 15, right: 15, bottom: 18 },
    });

    autoTable(documento, {
      startY: this.siguientePosicion(documento, 8),
      head: [['VENTAS POR PERIODO', 'TOTAL']],
      body: reporte.ventasPorMes.length
        ? reporte.ventasPorMes.map((item) => [etiquetaPeriodo(item.periodo), formatearClp(item.total)])
        : [['Sin ventas en el periodo', formatearClp(0)]],
      theme: 'grid',
      headStyles: { fillColor: azulMangata, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', cellWidth: 50 } },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 15, right: 15, bottom: 18 },
    });

    this.agregarPie(documento);
    return documento;
  }

  private agregarEncabezado(documento: jsPDF, desde: string, hasta: string): void {
    documento.setFillColor(...azulMangata);
    documento.rect(0, 0, 210, 40, 'F');
    documento.setFillColor(...cobreMangata);
    documento.circle(20, 17, 6, 'F');
    documento.setTextColor(255, 255, 255);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(13);
    documento.text('M', 17.6, 19.1);
    documento.setFontSize(11);
    documento.text('MANGATA SPA', 31, 14);
    documento.setFontSize(20);
    documento.text('Reporte de Gestión', 31, 24);
    documento.setFont('helvetica', 'normal');
    documento.setFontSize(8.5);
    documento.text(`Periodo: ${formatearFechaReporte(desde)} al ${formatearFechaReporte(hasta)}`, 31, 31);
    documento.text(
      `Generado: ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`,
      195,
      31,
      { align: 'right' },
    );
  }

  private agregarResumen(documento: jsPDF, reporte: ReporteGeneral): void {
    documento.setTextColor(...azulMangata);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(11);
    documento.text('RESUMEN GENERAL', 15, 49);

    const indicadores = [
      ['Total pedidos', reporte.indicadores.totalPedidos.toString()],
      ['Pendientes', reporte.indicadores.pedidosPendientes.toString()],
      ['Entregados', reporte.indicadores.pedidosEntregados.toString()],
      ['Ventas del periodo', formatearClp(reporte.indicadores.totalVentas)],
    ];

    indicadores.forEach(([titulo, valor], indice) => {
      const x = 15 + indice * 45.5;
      documento.setFillColor(245, 247, 248);
      documento.setDrawColor(216, 223, 228);
      documento.roundedRect(x, 54, 41.5, 17, 2, 2, 'FD');
      documento.setFont('helvetica', 'normal');
      documento.setFontSize(7.5);
      documento.setTextColor(92, 108, 120);
      documento.text(titulo, x + 3, 60);
      documento.setFont('helvetica', 'bold');
      documento.setFontSize(valor.length > 13 ? 10 : 13);
      documento.setTextColor(...azulMangata);
      documento.text(valor, x + 3, 67);
    });
  }

  private siguientePosicion(documento: jsPDF, espacio: number): number {
    const ultimaTabla = (documento as DocumentoConAutoTable).lastAutoTable;
    return ultimaTabla ? ultimaTabla.finalY + espacio : 50;
  }

  private agregarPie(documento: jsPDF): void {
    const paginas = documento.getNumberOfPages();
    for (let pagina = 1; pagina <= paginas; pagina += 1) {
      documento.setPage(pagina);
      documento.setDrawColor(216, 223, 228);
      documento.line(15, 284, 195, 284);
      documento.setFont('helvetica', 'normal');
      documento.setFontSize(7.5);
      documento.setTextColor(92, 108, 120);
      documento.text('Generado mediante Sistema Mangata SPA', 15, 289);
      documento.text(`Página ${pagina} de ${paginas}`, 195, 289, { align: 'right' });
    }
  }
}
