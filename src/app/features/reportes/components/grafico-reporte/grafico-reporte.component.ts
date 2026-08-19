import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
@Component({
  selector: 'app-grafico-reporte',
  template: '<canvas #lienzo></canvas>',
  styles: [
    ':host{display:block;position:relative;height:300px}canvas{max-width:100%;max-height:100%}',
  ],
})
export class GraficoReporteComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('lienzo') lienzo?: ElementRef<HTMLCanvasElement>;
  @Input() tipo: 'bar' | 'doughnut' | 'line' = 'bar';
  @Input() etiquetas: string[] = [];
  @Input() valores: number[] = [];
  @Input() colores: string[] = [];
  @Input() horizontal = false;
  @Input() moneda = false;
  private grafico?: Chart;
  ngAfterViewInit() {
    this.renderizar();
  }
  ngOnChanges(_: SimpleChanges) {
    if (this.lienzo) this.renderizar();
  }
  ngOnDestroy() {
    this.grafico?.destroy();
  }
  private renderizar() {
    this.grafico?.destroy();
    if (!this.lienzo) return;
    const configuracion: ChartConfiguration = {
      type: this.tipo,
      data: {
        labels: this.etiquetas,
        datasets: [
          {
            data: this.valores,
            backgroundColor: this.tipo === 'line' ? '#d9774526' : this.colores,
            borderColor: this.tipo === 'line' ? '#d97745' : this.colores,
            borderWidth: this.tipo === 'line' ? 2 : 1,
            tension: 0.3,
            fill: this.tipo === 'line',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.horizontal ? 'y' : 'x',
        plugins: {
          legend: { display: this.tipo === 'doughnut', position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) =>
                this.moneda
                  ? new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                      maximumFractionDigits: 0,
                    }).format(Number(context.raw))
                  : String(context.raw),
            },
          },
        },
        scales:
          this.tipo === 'doughnut'
            ? {}
            : { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { precision: 0 } } },
      },
    };
    this.grafico = new Chart(this.lienzo.nativeElement, configuracion);
  }
}
