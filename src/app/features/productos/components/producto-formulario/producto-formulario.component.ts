import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaProducto } from '../../../../shared/enums/categoria-producto';
import { DatosProducto, Producto } from '../../interfaces/producto';

@Component({
  selector: 'app-producto-formulario',
  imports: [ReactiveFormsModule],
  templateUrl: './producto-formulario.component.html',
  styleUrl: './producto-formulario.component.css',
})
export class ProductoFormularioComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() producto: Producto | null = null;
  @Input() procesando = false;
  @Input() textoBoton = 'Guardar producto';
  @Output() readonly confirmar = new EventEmitter<DatosProducto>();

  readonly categorias = Object.values(CategoriaProducto);
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(1000)],
    categoria: ['', [Validators.required, Validators.pattern(/^(TROFEO|MEDALLA|PLACA|FIGURA_3D|LLAVERO|OTRO)$/)]],
    material: ['', Validators.maxLength(100)],
    precioBase: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    imagenUrl: ['', [Validators.maxLength(1000), Validators.pattern(/^$|^https:\/\/.+\.(?:jpe?g|png|webp)(?:\?.*)?$/i)]],
  });

  ngOnChanges(): void {
    if (!this.producto) return;
    this.formulario.patchValue({
      nombre: this.producto.nombre,
      descripcion: this.producto.descripcion ?? '',
      categoria: this.producto.categoria,
      material: this.producto.material ?? '',
      precioBase: this.producto.precioBase,
      imagenUrl: this.producto.imagenUrl ?? '',
    });
  }

  enviar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.procesando) return;
    const valores = this.formulario.getRawValue();
    this.confirmar.emit({
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      categoria: valores.categoria as CategoriaProducto,
      material: valores.material.trim() || null,
      precioBase: Number(valores.precioBase),
      imagenUrl: valores.imagenUrl.trim() || null,
    });
  }
}
