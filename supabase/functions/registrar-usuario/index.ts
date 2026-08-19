import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DatosPersonalesServidor, RolUsuarioServidor, datosPersonalesValidos, normalizarDatosPersonales, rolUsuarioValido } from '../_shared/validaciones-usuario.ts';

const cabecerasCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
interface SolicitudRegistro extends DatosPersonalesServidor {
  nombre: string; apellido: string; rut: string; correo: string;
  telefono: string | null; rol: RolUsuarioServidor; contrasena?: string; sinAcceso?: boolean;
}

const esSolicitudRegistro = (valor: unknown): valor is SolicitudRegistro => {
  if (typeof valor !== 'object' || valor === null) return false;
  const datos = valor as Record<string, unknown>;
  const telefonoValido = datos['telefono'] === null || datos['telefono'] === undefined || typeof datos['telefono'] === 'string';
  const tiposValidos = typeof datos['nombre'] === 'string' && typeof datos['apellido'] === 'string'
    && typeof datos['rut'] === 'string' && typeof datos['correo'] === 'string' && telefonoValido;
  if (!tiposValidos) return false;
  const personales = { nombre: datos['nombre'], apellido: datos['apellido'], rut: datos['rut'], correo: datos['correo'], telefono: datos['telefono'] ?? null };
  return datosPersonalesValidos(personales)
    && rolUsuarioValido(datos['rol'])
    && ((datos['sinAcceso'] === true && datos['rol'] === 'CLIENTE')
      || (typeof datos['contrasena'] === 'string' && datos['contrasena'].length >= 8
        && /[A-Za-z]/.test(datos['contrasena']) && /\d/.test(datos['contrasena'])));
};

const responder = (estado: number, mensaje: string) => new Response(JSON.stringify({ mensaje }), {
  status: estado, headers: { ...cabecerasCors, 'Content-Type': 'application/json' },
});

Deno.serve(async (solicitud) => {
  if (solicitud.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });
  if (solicitud.method !== 'POST') return responder(405, 'Método no permitido.');

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const autorizacion = solicitud.headers.get('Authorization');
  if (!url || !anonKey || !serviceRoleKey || !autorizacion) return responder(401, 'No autorizado.');

  const clienteSolicitante = createClient(url, anonKey, { global: { headers: { Authorization: autorizacion } } });
  const { data: usuarioActual, error: errorUsuario } = await clienteSolicitante.auth.getUser();
  if (errorUsuario || !usuarioActual.user) return responder(401, 'La sesión no es válida.');

  const { data: perfil } = await clienteSolicitante.from('perfil').select('rol').eq('id', usuarioActual.user.id).single();
  if (perfil?.rol !== 'ADMINISTRADOR') return responder(403, 'Solo un administrador puede registrar usuarios.');

  let contenido: unknown;
  try { contenido = await solicitud.json(); } catch { return responder(400, 'Los datos enviados no son válidos.'); }
  if (!esSolicitudRegistro(contenido)) return responder(400, 'Completa correctamente todos los datos obligatorios.');
  const datos = contenido;
  const personales = normalizarDatosPersonales(datos);
  const correo = personales.correo;

  const administrador = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: correoRepetido, error: errorCorreo } = await administrador
    .from('perfil').select('id').eq('correo', correo).limit(1);
  const { data: rutRepetido, error: errorRut } = await administrador
    .from('perfil').select('id').in('rut', [personales.rut, personales.rut.replaceAll('.', '')]).limit(1);
  if (errorCorreo || errorRut) return responder(500, 'No fue posible validar los datos del usuario.');
  if (correoRepetido?.length || rutRepetido?.length) return responder(409, 'El correo o el RUT ya se encuentra registrado.');

  const { data: creado, error: errorCreacion } = await administrador.auth.admin.createUser({
    email: correo,
    // La FK perfil.id -> auth.users.id exige identidad aun para clientes presenciales.
    password: datos.sinAcceso ? `${crypto.randomUUID()}Aa9!` : datos.contrasena,
    email_confirm: true,
    user_metadata: datos.sinAcceso ? { acceso_pendiente: true } : {},
  });
  if (errorCreacion || !creado.user) return responder(400, 'No fue posible crear la cuenta. Verifica que el correo no esté registrado.');

  const { error: errorPerfil } = await administrador.from('perfil').insert({
    id: creado.user.id, ...personales, rol: datos.rol,
  });
  if (errorPerfil) {
    await administrador.auth.admin.deleteUser(creado.user.id);
    return responder(400, 'No fue posible registrar el perfil. Verifica que el RUT no esté registrado.');
  }
  return responder(201, 'Usuario registrado correctamente.');
});
