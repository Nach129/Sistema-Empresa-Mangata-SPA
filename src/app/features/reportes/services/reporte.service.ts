import { Injectable,inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { FiltrosReporte,ReporteGeneral,ReporteRespuestaBaseDatos } from '../interfaces/reporte';

@Injectable({providedIn:'root'})
export class ReporteService {
  private readonly supabase=inject(SupabaseService).client;
  async obtenerReporte(filtros:FiltrosReporte):Promise<ReporteGeneral>{
    const {data,error}=await this.supabase.rpc('obtener_reporte_general',{p_desde:filtros.desde,p_hasta:filtros.hasta,p_estado:filtros.estado,p_producto_id:filtros.productoId});
    if(error)throw error;return this.mapear(data as ReporteRespuestaBaseDatos);
  }
  private mapear(d:ReporteRespuestaBaseDatos):ReporteGeneral{return{indicadores:{totalPedidos:Number(d.indicadores.total_pedidos),pedidosPendientes:Number(d.indicadores.pedidos_pendientes),pedidosEntregados:Number(d.indicadores.pedidos_entregados),totalVentas:Number(d.indicadores.total_ventas)},pedidosPorEstado:d.pedidos_por_estado.map(x=>({...x,cantidad:Number(x.cantidad)})),productosMasSolicitados:d.productos_mas_solicitados.map(x=>({productoId:x.producto_id,nombre:x.nombre,cantidad:Number(x.cantidad)})),ventasPorMes:d.ventas_por_mes.map(x=>({periodo:x.periodo,total:Number(x.total)})),productosFiltro:d.productos_filtro};}
}
