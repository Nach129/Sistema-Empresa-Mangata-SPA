import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { UsuarioService } from '../../services/usuario.service';
import { RegistroUsuarioComponent } from './registro-usuario.component';

describe('RegistroUsuarioComponent', () => {
  const servicio = { registrarUsuario: vi.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    servicio.registrarUsuario.mockClear();
    await TestBed.configureTestingModule({
      imports: [RegistroUsuarioComponent],
      providers: [provideRouter([]), { provide: UsuarioService, useValue: servicio }],
    }).compileComponents();
  });

  it('rechaza contenido inválido aunque sea pegado', async () => {
    const componente = TestBed.createComponent(RegistroUsuarioComponent).componentInstance;
    componente.formulario.patchValue({ nombre: 'Andrea123', apellido: 'Navia@', rut: '123', telefono: 'abcdef', correo: 'usuario correo@gmail.com', rol: 'ROL_FALSO', contrasena: 'sinNumeros' });
    await componente.registrar();
    expect(componente.formulario.invalid).toBe(true);
    expect(servicio.registrarUsuario).not.toHaveBeenCalled();
  });

  it('normaliza todos los datos antes de registrar', async () => {
    const componente = TestBed.createComponent(RegistroUsuarioComponent).componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    componente.formulario.setValue({ nombre: '  María   José ', apellido: ' Pérez  González ', rut: '12345678-5', telefono: '+56 9 1234 5678', correo: 'USUARIO@GMAIL.COM ', rol: RolUsuario.Cliente, contrasena: 'Clave1234' });
    await componente.registrar();
    expect(servicio.registrarUsuario).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'María José', apellido: 'Pérez González', rut: '12.345.678-5', telefono: '+56912345678', correo: 'usuario@gmail.com' }));
  });
});
