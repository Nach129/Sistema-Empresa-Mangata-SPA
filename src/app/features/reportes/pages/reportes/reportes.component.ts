import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstadoPedido } from '../../../../shared/enums/estado-pedido';
import { GraficoReporteComponent } from '../../components/grafico-reporte/grafico-reporte.component';
import { IndicadoresReporteComponent } from '../../components/indicadores-reporte/indicadores-reporte.component';
import { SelectorProductoReporteComponent } from '../../components/selector-producto-reporte/selector-producto-reporte.component';
import { FiltrosReporte, ReporteGeneral } from '../../interfaces/reporte';
import { ReportePdfService } from '../../services/reporte-pdf.service';
import { ReporteService } from '../../services/reporte.service';
import { completarEstados, etiquetaEstado, etiquetaPeriodo, estadosPedido, formatearClp, rangoFechasValido } from '../../utils/reporte-utilidades';

@Component({
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, GraficoReporteComponent, IndicadoresReporteComponent, SelectorProductoReporteComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css',
})
export class ReportesComponent {
  private readonly servicio = inject(ReporteService);
  private readonly servicioPdf = inject(ReportePdfService);
  readonly reporte = signal<ReporteGeneral | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorFiltros = signal('');
  readonly modalPdfAbierto = signal(false);
  readonly generandoPdf = signal(false);
  readonly errorPdf = signal('');
  readonly estados = estadosPedido;
  readonly coloresEstados = ['#497aa8', '#d69a54', '#bd7b46', '#6b9b83', '#31866b', '#b75b55'];
  readonly formulario = new FormGroup({
    desde: new FormControl<string | null>(null), hasta: new FormControl<string | null>(null),
    estado: new FormControl<EstadoPedido | null>(null), productoId: new FormControl<number | null>(null),
  });
  readonly formularioPdf = new FormGroup({
    desde: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hasta: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly estadosCompletos = computed(() => completarEstados(this.reporte()?.pedidosPorEstado ?? []));
  readonly etiquetasEstados = computed(() => this.estadosCompletos().map((item) => etiquetaEstado(item.estado)));
  readonly valoresEstados = computed(() => this.estadosCompletos().map((item) => item.cantidad));
  readonly etiquetasProductos = computed(() => this.reporte()?.productosMasSolicitados.map((item) => item.nombre) ?? []);
  readonly valoresProductos = computed(() => this.reporte()?.productosMasSolicitados.map((item) => item.cantidad) ?? []);
  readonly etiquetasVentas = computed(() => this.reporte()?.ventasPorMes.map((item) => etiquetaPeriodo(item.periodo)) ?? []);
  readonly valoresVentas = computed(() => this.reporte()?.ventasPorMes.map((item) => item.total) ?? []);
  readonly formatearClp = formatearClp;
  readonly etiquetaEstado = etiquetaEstado;

  constructor() { void this.cargar(this.filtros()); }

  async aplicar(): Promise<void> {
    const filtros = this.filtros();
    if (!rangoFechasValido(filtros.desde, filtros.hasta)) {
      this.errorFiltros.set('La fecha desde no puede ser posterior a la fecha hasta.'); return;
    }
    this.errorFiltros.set(''); await this.cargar(filtros);
  }

  async limpiar(): Promise<void> {
    this.formulario.reset({ desde: null, hasta: null, estado: null, productoId: null });
    this.errorFiltros.set(''); await this.cargar(this.filtros());
  }

  seleccionarProducto(productoId: number | null): void { this.formulario.controls.productoId.setValue(productoId); }

  abrirModalPdf(): void {
    const hoy = new Date();
    this.formularioPdf.reset({ desde: this.fechaIsoLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: this.fechaIsoLocal(hoy) });
    this.errorPdf.set(''); this.modalPdfAbierto.set(true);
  }

  cerrarModalPdf(): void {
    if (this.generandoPdf()) return;
    this.modalPdfAbierto.set(false); this.errorPdf.set('');
  }

  async generarPdf(): Promise<void> {
    if (this.generandoPdf()) return;
    const { desde, hasta } = this.formularioPdf.getRawValue();
    if (this.formularioPdf.invalid) {
      this.formularioPdf.markAllAsTouched(); this.errorPdf.set('Selecciona una fecha desde y una fecha hasta.'); return;
    }
    if (!rangoFechasValido(desde, hasta)) {
      this.errorPdf.set('La fecha desde no puede ser posterior a la fecha hasta.'); return;
    }
    this.generandoPdf.set(true); this.errorPdf.set('');
    try {
      const reportePdf = await this.servicio.obtenerReporte({ desde, hasta, estado: null, productoId: null });
      this.servicioPdf.descargar(reportePdf, desde, hasta); this.modalPdfAbierto.set(false);
    } catch { this.errorPdf.set('No fue posible generar el reporte PDF.'); }
    finally { this.generandoPdf.set(false); }
  }

  @HostListener('document:keydown.escape')
  cerrarModalConEscape(): void { if (this.modalPdfAbierto()) this.cerrarModalPdf(); }

  private filtros(): FiltrosReporte {
    const valor = this.formulario.getRawValue();
    return { desde: valor.desde || null, hasta: valor.hasta || null, estado: valor.estado || null, productoId: valor.productoId ? Number(valor.productoId) : null };
  }

  private async cargar(filtros: FiltrosReporte): Promise<void> {
    this.cargando.set(true); this.error.set('');
    try { this.reporte.set(await this.servicio.obtenerReporte(filtros)); }
    catch { this.error.set('No fue posible cargar los reportes.'); }
    finally { this.cargando.set(false); }
  }

  private fechaIsoLocal(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }
}
