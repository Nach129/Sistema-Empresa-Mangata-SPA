import { EstadoPedido } from '../../../shared/enums/estado-pedido';
import { PedidoPorEstado } from '../interfaces/reporte';

export const estadosPedido=Object.values(EstadoPedido);
export function etiquetaEstado(estado:EstadoPedido):string{return estado.replaceAll('_',' ');}
export function formatearClp(valor:number):string{return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(valor);}
export function rangoFechasValido(desde:string|null,hasta:string|null):boolean{return !desde||!hasta||desde<=hasta;}
export function completarEstados(datos:PedidoPorEstado[]):PedidoPorEstado[]{return estadosPedido.map(estado=>datos.find(x=>x.estado===estado)??{estado,cantidad:0});}
export function etiquetaPeriodo(periodo:string):string{const [ano,mes]=periodo.split('-').map(Number);return new Intl.DateTimeFormat('es-CL',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(ano,mes-1,1)));}
