import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cabecerasCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const roles = ['ADMINISTRADOR', 'TRABAJADOR', 'CLIENTE'] as const;
type Rol = typeof roles[number];

interface SolicitudRegistro {
  nombre: string; apellido: string; rut: string; correo: string;
  telefono: string | null; rol: Rol; contrasena: string;
}

const esSolicitudRegistro = (valor: unknown): valor is SolicitudRegistro => {
  if (typeof valor !== 'object' || valor === null) return false;
  const datos = valor as Record<string, unknown>;
  const telefonoValido = datos['telefono'] === null || datos['telefono'] === undefined
    || (typeof datos['telefono'] === 'string' && /^$|^[+\d][\d\s()-]{7,19}$/.test(datos['telefono']));

  return typeof datos['nombre'] === 'string' && datos['nombre'].trim().length > 0 && datos['nombre'].trim().length <= 100
    && typeof datos['apellido'] === 'string' && datos['apellido'].trim().length > 0 && datos['apellido'].trim().length <= 100
    && typeof datos['rut'] === 'string' && /^\d{1,2}\.?(?:\d{3}\.?){2}-[\dkK]$/.test(datos['rut'].trim())
    && typeof datos['correo'] === 'string' && datos['correo'].trim().length <= 150
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos['correo'].trim())
    && telefonoValido
    && typeof datos['rol'] === 'string' && roles.includes(datos['rol'] as Rol)
    && typeof datos['contrasena'] === 'string' && datos['contrasena'].length >= 8
    && /[A-Za-z]/.test(datos['contrasena']) && /\d/.test(datos['contrasena']);
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
  const correo = datos.correo?.trim().toLowerCase();

  const administrador = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: correoRepetido, error: errorCorreo } = await administrador
    .from('perfil').select('id').eq('correo', correo).limit(1);
  const { data: rutRepetido, error: errorRut } = await administrador
    .from('perfil').select('id').eq('rut', datos.rut.trim()).limit(1);
  if (errorCorreo || errorRut) return responder(500, 'No fue posible validar los datos del usuario.');
  if (correoRepetido?.length || rutRepetido?.length) return responder(409, 'El correo o el RUT ya se encuentra registrado.');

  const { data: creado, error: errorCreacion } = await administrador.auth.admin.createUser({
    email: correo, password: datos.contrasena, email_confirm: true,
  });
  if (errorCreacion || !creado.user) return responder(400, 'No fue posible crear la cuenta. Verifica que el correo no esté registrado.');

  const { error: errorPerfil } = await administrador.from('perfil').insert({
    id: creado.user.id, nombre: datos.nombre.trim(), apellido: datos.apellido.trim(), rut: datos.rut.trim(),
    correo, telefono: datos.telefono?.trim() || null, rol: datos.rol,
  });
  if (errorPerfil) {
    await administrador.auth.admin.deleteUser(creado.user.id);
    return responder(400, 'No fue posible registrar el perfil. Verifica que el RUT no esté registrado.');
  }
  return responder(201, 'Usuario registrado correctamente.');
});
