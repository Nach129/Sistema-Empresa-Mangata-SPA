import { TestBed } from '@angular/core/testing';
import { RolUsuario } from '../../../../shared/enums/rol-usuario';
import { AutenticacionService } from '../../../../core/services/autenticacion.service';
import { UsuarioService } from '../../services/usuario.service';
import { PerfilComponent } from './perfil.component';

describe('PerfilComponent', () => {
  const perfil = { id: '1', nombre: 'Andrea', apellido: 'Navia', rut: '21.349.954-8', correo: 'andrea@mangata.cl', telefono: '+56912345678', rol: RolUsuario.Trabajador, created_at: '', updated_at: '' };
  const autenticacion = { cargarPerfil: vi.fn().mockResolvedValue(perfil) };
  const servicio = { actualizarPerfil: vi.fn().mockResolvedValue(perfil) };

  beforeEach(async () => {
    autenticacion.cargarPerfil.mockReset().mockResolvedValue(perfil);
    servicio.actualizarPerfil.mockClear();
    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        { provide: AutenticacionService, useValue: autenticacion },
        { provide: UsuarioService, useValue: servicio },
      ],
    }).compileComponents();
  });

  it('mantiene el rol deshabilitado y rechaza datos pegados inválidos', async () => {
    const componente = TestBed.createComponent(PerfilComponent).componentInstance;
    await vi.waitFor(() => expect(componente.cargando()).toBe(false));
    expect(componente.formulario.controls.rol.disabled).toBe(true);
    componente.formulario.patchValue({ nombre: 'Andrea123', telefono: '9abc5678', rut: '11.111.111-2' });
    await componente.guardar();
    expect(componente.formulario.invalid).toBe(true);
    expect(servicio.actualizarPerfil).not.toHaveBeenCalled();
  });

  it('normaliza los datos válidos antes de actualizar el perfil', async () => {
    const componente = TestBed.createComponent(PerfilComponent).componentInstance;
    await vi.waitFor(() => expect(componente.cargando()).toBe(false));
    componente.formulario.patchValue({ nombre: ' María  José ', apellido: ' Pérez ', rut: '12345678-5', correo: 'PERSONA@MANGATA.CL ', telefono: '912345678' });
    await componente.guardar();
    expect(servicio.actualizarPerfil).toHaveBeenCalledWith({ nombre: 'María José', apellido: 'Pérez', rut: '12.345.678-5', correo: 'persona@mangata.cl', telefono: '+56912345678' });
  });

  it('permite modificar un campo válido aunque un RUT histórico sin modificar sea inválido', async () => {
    autenticacion.cargarPerfil.mockResolvedValueOnce({ ...perfil, rut: '21.459.476-6' });
    const componente = TestBed.createComponent(PerfilComponent).componentInstance;
    await vi.waitFor(() => expect(componente.cargando()).toBe(false));
    expect(componente.formulario.invalid).toBe(true);
    componente.formulario.controls.apellido.setValue('Alfaro');
    expect(componente.puedeGuardar()).toBe(true);
    await componente.guardar();
    expect(servicio.actualizarPerfil).toHaveBeenCalledWith(expect.objectContaining({ apellido: 'Alfaro', rut: '21.459.476-6' }));
  });
});
