import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DatosPersonalesServidor, RolUsuarioServidor, datosPersonalesModificadosValidos, normalizarDatosPersonales, rolUsuarioValido } from '../_shared/validaciones-usuario.ts';

const cabecerasCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
interface DatosActualizacion extends DatosPersonalesServidor {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuarioServidor;
}

type Solicitud =
  | { accion: 'listar' }
  | { accion: 'actualizar'; usuario: DatosActualizacion }
  | { accion: 'eliminar'; id: string };

const responder = (estado: number, cuerpo: Record<string, unknown>) => new Response(JSON.stringify(cuerpo), {
  status: estado,
  headers: { ...cabecerasCors, 'Content-Type': 'application/json' },
});

const esDatosActualizacion = (valor: unknown): valor is DatosActualizacion => {
  if (typeof valor !== 'object' || valor === null) return false;
  const datos = valor as Record<string, unknown>;
  const tiposValidos = typeof datos['id'] === 'string' && /^[0-9a-f-]{36}$/i.test(datos['id'])
    && typeof datos['nombre'] === 'string' && typeof datos['apellido'] === 'string'
    && typeof datos['rut'] === 'string' && typeof datos['correo'] === 'string'
    && (datos['telefono'] === null || typeof datos['telefono'] === 'string');
  if (!tiposValidos) return false;
  return rolUsuarioValido(datos['rol']);
};

Deno.serve(async (solicitud) => {
  if (solicitud.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (solicitud.method !== 'POST') return responder(405, { codigo: 'METODO_INVALIDO' });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const autorizacion = solicitud.headers.get('Authorization');
  if (!url || !anonKey || !serviceRoleKey || !autorizacion) return responder(401, { codigo: 'NO_AUTORIZADO' });

  const solicitante = createClient(url, anonKey, { global: { headers: { Authorization: autorizacion } } });
  const { data: sesion, error: errorSesion } = await solicitante.auth.getUser();
  if (errorSesion || !sesion.user) return responder(401, { codigo: 'SESION_INVALIDA' });

  const administrador = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: perfilSolicitante } = await administrador.from('perfil').select('rol').eq('id', sesion.user.id).single();
  if (perfilSolicitante?.rol !== 'ADMINISTRADOR') return responder(403, { codigo: 'NO_AUTORIZADO' });

  let contenido: unknown;
  try { contenido = await solicitud.json(); } catch { return responder(400, { codigo: 'DATOS_INVALIDOS' }); }
  if (typeof contenido !== 'object' || contenido === null || !('accion' in contenido)) return responder(400, { codigo: 'DATOS_INVALIDOS' });
  const datosSolicitud = contenido as Solicitud;

  if (datosSolicitud.accion === 'listar') {
    const { data, error } = await administrador.from('perfil').select('id,nombre,apellido,rut,correo,telefono,rol,created_at,updated_at').order('nombre').order('apellido');
    return error ? responder(500, { codigo: 'ERROR_LISTADO' }) : responder(200, { usuarios: data });
  }

  if (datosSolicitud.accion === 'actualizar') {
    if (!esDatosActualizacion(datosSolicitud.usuario)) return responder(400, { codigo: 'DATOS_INVALIDOS' });
    const datos = datosSolicitud.usuario;
    const personales = normalizarDatosPersonales(datos);
    const correo = personales.correo;
    const rut = personales.rut;
    const { data: actual, error: errorActual } = await administrador.from('perfil').select('*').eq('id', datos.id).single();
    if (errorActual || !actual) return responder(404, { codigo: 'USUARIO_NO_EXISTE' });
    if (!datosPersonalesModificadosValidos(personales, actual)) return responder(400, { codigo: 'DATOS_INVALIDOS' });

    const [consultaCorreo, consultaRut] = await Promise.all([
      administrador.from('perfil').select('id').eq('correo', correo).neq('id', datos.id).limit(1),
      administrador.from('perfil').select('id').in('rut', [rut, rut.replaceAll('.', '')]).neq('id', datos.id).limit(1),
    ]);
    if (consultaCorreo.error || consultaRut.error) return responder(500, { codigo: 'ERROR_VALIDACION' });
    if (consultaCorreo.data?.length) return responder(409, { codigo: 'CORREO_REPETIDO' });
    if (consultaRut.data?.length) return responder(409, { codigo: 'RUT_REPETIDO' });
    if (actual.rol === 'ADMINISTRADOR' && datos.rol !== 'ADMINISTRADOR') {
      const { count } = await administrador.from('perfil').select('id', { head: true, count: 'exact' }).eq('rol', 'ADMINISTRADOR');
      if ((count ?? 0) <= 1) return responder(409, { codigo: 'ULTIMO_ADMINISTRADOR' });
    }

    const correoCambio = actual.correo.toLowerCase() !== correo;
    if (correoCambio) {
      const { error } = await administrador.auth.admin.updateUserById(datos.id, { email: correo, email_confirm: true });
      if (error) return responder(409, { codigo: 'CORREO_REPETIDO' });
    }
    const actualesNormalizados = normalizarDatosPersonales(actual);
    const cambios: Record<string, string | null> = { updated_at: new Date().toISOString() };
    const camposPersonales = ['nombre', 'apellido', 'rut', 'correo', 'telefono'] as const;
    for (const campo of camposPersonales) {
      if (personales[campo] !== actualesNormalizados[campo]) cambios[campo] = personales[campo];
    }
    if (datos.rol !== actual.rol) cambios['rol'] = datos.rol;
    const { data: actualizado, error: errorPerfil } = await administrador.from('perfil').update(cambios).eq('id', datos.id).select('*').single();
    if (errorPerfil) {
      if (correoCambio) await administrador.auth.admin.updateUserById(datos.id, { email: actual.correo, email_confirm: true });
      const codigo = errorPerfil.message.includes('ULTIMO_ADMINISTRADOR') ? 'ULTIMO_ADMINISTRADOR' : 'ERROR_ACTUALIZACION';
      return responder(409, { codigo });
    }
    return responder(200, { usuario: actualizado });
  }

  if (datosSolicitud.accion === 'eliminar') {
    const id = datosSolicitud.id;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return responder(400, { codigo: 'DATOS_INVALIDOS' });
    if (id === sesion.user.id) return responder(409, { codigo: 'AUTOELIMINACION' });
    const { data: perfil } = await administrador.from('perfil').select('rol').eq('id', id).single();
    if (!perfil) return responder(404, { codigo: 'USUARIO_NO_EXISTE' });
    if (perfil.rol === 'ADMINISTRADOR') {
      const { count } = await administrador.from('perfil').select('id', { head: true, count: 'exact' }).eq('rol', 'ADMINISTRADOR');
      if ((count ?? 0) <= 1) return responder(409, { codigo: 'ULTIMO_ADMINISTRADOR' });
    }
    const [consultaPedidos, consultaHistoriales] = await Promise.all([
      administrador.from('pedido').select('id', { head: true, count: 'exact' }).eq('cliente_id', id),
      administrador.from('historial_pedido').select('id', { head: true, count: 'exact' }).eq('usuario_id', id),
    ]);
    if (consultaPedidos.error || consultaHistoriales.error) return responder(500, { codigo: 'ERROR_VALIDACION' });
    if ((consultaPedidos.count ?? 0) > 0 || (consultaHistoriales.count ?? 0) > 0) {
      return responder(409, { codigo: 'REGISTROS_ASOCIADOS' });
    }

    const { error } = await administrador.auth.admin.deleteUser(id);
    if (error) {
      const codigo = error.message.includes('ULTIMO_ADMINISTRADOR') ? 'ULTIMO_ADMINISTRADOR' : 'ERROR_ELIMINACION';
      return responder(409, { codigo });
    }
    return responder(200, { eliminado: true });
  }

  return responder(400, { codigo: 'ACCION_INVALIDA' });
});
