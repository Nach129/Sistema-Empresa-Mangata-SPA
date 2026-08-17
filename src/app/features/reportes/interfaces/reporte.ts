import { EstadoPedido } from '../../../shared/enums/estado-pedido';

export interface FiltrosReporte { desde:string|null; hasta:string|null; estado:EstadoPedido|null; productoId:number|null; }
export interface IndicadoresReporte { totalPedidos:number; pedidosPendientes:number; pedidosEntregados:number; totalVentas:number; }
export interface PedidoPorEstado { estado:EstadoPedido; cantidad:number; }
export interface ProductoSolicitado { productoId:number; nombre:string; cantidad:number; }
export interface VentaPorMes { periodo:string; total:number; }
export interface ProductoFiltroReporte { id:number; nombre:string; activo:boolean; }
export interface ReporteGeneral { indicadores:IndicadoresReporte; pedidosPorEstado:PedidoPorEstado[]; productosMasSolicitados:ProductoSolicitado[]; ventasPorMes:VentaPorMes[]; productosFiltro:ProductoFiltroReporte[]; }

export interface ReporteRespuestaBaseDatos {
  indicadores:{total_pedidos:number;pedidos_pendientes:number;pedidos_entregados:number;total_ventas:number|string};
  pedidos_por_estado:Array<{estado:EstadoPedido;cantidad:number}>;
  productos_mas_solicitados:Array<{producto_id:number;nombre:string;cantidad:number}>;
  ventas_por_mes:Array<{periodo:string;total:number|string}>;
  productos_filtro:Array<{id:number;nombre:string;activo:boolean}>;
}
