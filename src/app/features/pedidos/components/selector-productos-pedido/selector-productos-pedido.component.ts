import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../../productos/interfaces/producto';
import { LineaPedido } from '../../interfaces/pedido';

@Component({selector:'app-selector-productos-pedido',imports:[ReactiveFormsModule],templateUrl:'./selector-productos-pedido.component.html'})
export class SelectorProductosPedidoComponent {
  readonly productos=input.required<Producto[]>(); readonly idsAgregados=input<number[]>([]); readonly agregar=output<LineaPedido>(); readonly error=output<string>();
  readonly formulario=new FormGroup({productoId:new FormControl<number|null>(null,{validators:[Validators.required]}),cantidad:new FormControl(1,{nonNullable:true,validators:[Validators.required,Validators.min(1),Validators.pattern(/^\d+$/)]}),personalizacion:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(500)]})});
  confirmar():void{if(this.formulario.invalid){this.formulario.markAllAsTouched();return;}const v=this.formulario.getRawValue();if(v.productoId===null)return;if(this.idsAgregados().includes(v.productoId)){this.error.emit('Este producto ya está agregado. Modifica su cantidad en el detalle.');return;}this.agregar.emit({productoId:v.productoId,cantidad:v.cantidad,personalizacion:v.personalizacion.trim()||null});this.formulario.reset({productoId:null,cantidad:1,personalizacion:''});}
}
