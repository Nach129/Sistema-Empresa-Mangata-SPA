import { EstadoPedido } from '../../../shared/enums/estado-pedido';
import { Producto } from '../../productos/interfaces/producto';

export interface ClientePedido { id: string; nombre: string; apellido: string; rut: string; correo: string; }
export interface NuevoClientePedido { nombre:string; apellido:string; rut:string; correo:string; telefono:string|null; }
export interface DetallePedido { id: number; productoId: number; cantidad: number; precioUnitario: number; subtotal: number; personalizacion: string | null; producto: Pick<Producto, 'id'|'nombre'|'categoria'|'activo'> | null; }
export interface HistorialPedido { id: number; estadoAnterior: EstadoPedido|null; estadoNuevo: EstadoPedido; observacion: string|null; fecha: string; responsable: string; }
export interface Pedido { id: number; numeroPedido: string; clienteId: string; cliente: ClientePedido|null; estado: EstadoPedido; fechaSolicitud: string; fechaEntrega: string|null; total: number; observaciones: string|null; fechaCreacion: string; }
export interface PedidoCompleto extends Pedido { detalles: DetallePedido[]; historial: HistorialPedido[]; }
export interface LineaPedido { productoId: number; cantidad: number; personalizacion: string|null; }
export interface DatosPedido { clienteId: string; fechaEntrega: string|null; observaciones: string|null; detalles: LineaPedido[]; }

export interface PedidoBaseDatos { id:number; numero_pedido:string; cliente_id:string; estado:EstadoPedido; fecha_solicitud:string; fecha_entrega:string|null; total:number|string; observaciones:string|null; created_at:string; cliente: ClientePedido|null; }
export interface DetalleBaseDatos { id:number; producto_id:number; cantidad:number; precio_unitario:number|string; subtotal:number|string; personalizacion:string|null; producto: Pick<Producto,'id'|'nombre'|'categoria'|'activo'>|null; }
export interface HistorialBaseDatos { id:number; estado_anterior:EstadoPedido|null; estado_nuevo:EstadoPedido; observacion:string|null; created_at:string; responsable_nombre:string|null; responsable_apellido:string|null; }
