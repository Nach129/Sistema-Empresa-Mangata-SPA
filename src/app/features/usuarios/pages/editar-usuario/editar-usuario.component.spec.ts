import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { PerfilUsuario } from '../../interfaces/perfil-usuario';
import { UsuarioService } from '../../services/usuario.service';
import { EditarUsuarioComponent } from './editar-usuario.component';

describe('EditarUsuarioComponent', () => {
  const usuario: PerfilUsuario = {
    id: '11111111-1111-1111-1111-111111111111', nombre: 'Andrea', apellido: 'Navia', rut: '21.349.954-8',
    correo: 'andrea@mangata.cl', telefono: '+56 9 1234 5678', rol: RolUsuario.Trabajador, created_at: '', updated_at: '',
  };
  const servicio = {
    obtenerUsuario: vi.fn().mockResolvedValue(usuario),
    actualizarUsuario: vi.fn().mockResolvedValue(usuario),
  };

  beforeEach(async () => {
    servicio.obtenerUsuario.mockReset().mockResolvedValue(usuario);
    servicio.actualizarUsuario.mockClear();
    await TestBed.configureTestingModule({
      imports: [EditarUsuarioComponent],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => usuario.id } } } },
      ],
    }).compileComponents();
  });

  it('carga los datos actuales y valida el rol administrativo', async () => {
    const fixture = TestBed.createComponent(EditarUsuarioComponent);
    await fixture.whenStable();
    expect(fixture.componentInstance.formulario.controls.correo.value).toBe(usuario.correo);
    fixture.componentInstance.formulario.controls.rol.setValue('ROL_INVALIDO');
    expect(fixture.componentInstance.formulario.invalid).toBe(true);
  });

  it('no envía un formulario inválido', async () => {
    const fixture = TestBed.createComponent(EditarUsuarioComponent);
    await fixture.whenStable();
    fixture.componentInstance.formulario.controls.nombre.setValue('');
    await fixture.componentInstance.guardar();
    expect(servicio.actualizarUsuario).not.toHaveBeenCalled();
  });

  it('detecta contenido inválido pegado en todos los datos personales', async () => {
    const fixture = TestBed.createComponent(EditarUsuarioComponent);
    await fixture.whenStable();
    const formulario = fixture.componentInstance.formulario;
    formulario.patchValue({ nombre: 'Andrea123', apellido: 'Navia@', rut: '11.111.111-2', telefono: '9abc5678', correo: 'andrea correo@mangata.cl' });
    expect(formulario.controls.nombre.invalid).toBe(true);
    expect(formulario.controls.apellido.invalid).toBe(true);
    expect(formulario.controls.rut.invalid).toBe(true);
    expect(formulario.controls.telefono.invalid).toBe(true);
    expect(formulario.controls.correo.invalid).toBe(true);
  });

  it('normaliza y envía únicamente los campos administrables', async () => {
    const fixture = TestBed.createComponent(EditarUsuarioComponent);
    await fixture.whenStable();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.formulario.patchValue({ nombre: ' Andrea ', correo: 'ANDREA@MANGATA.CL', telefono: '912345678', rol: RolUsuario.Cliente });
    await fixture.componentInstance.guardar();
    expect(servicio.actualizarUsuario).toHaveBeenCalledWith(expect.objectContaining({ id: usuario.id, nombre: 'Andrea', correo: 'andrea@mangata.cl', telefono: '+56912345678', rol: RolUsuario.Cliente }));
    expect(navegar).toHaveBeenCalled();
  });

  it('habilita guardar un apellido válido aunque el RUT histórico sin modificar sea inválido', async () => {
    servicio.obtenerUsuario.mockResolvedValueOnce({ ...usuario, rut: '21.459.476-6' });
    const fixture = TestBed.createComponent(EditarUsuarioComponent);
    await fixture.whenStable();
    expect(fixture.componentInstance.formulario.invalid).toBe(true);
    fixture.componentInstance.formulario.controls.apellido.setValue('Alfaro');
    expect(fixture.componentInstance.puedeGuardar()).toBe(true);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.componentInstance.guardar();
    expect(servicio.actualizarUsuario).toHaveBeenCalledWith(expect.objectContaining({ apellido: 'Alfaro', rut: '21.459.476-6' }));
    expect(navegar).toHaveBeenCalled();
  });
});
