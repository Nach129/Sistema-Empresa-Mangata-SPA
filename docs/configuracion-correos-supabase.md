# Correos de autenticación de Mangata

Las plantillas HTML listas para Supabase están en `supabase/templates/`. Utilizan únicamente estilos inline, tablas compatibles con clientes de correo y las variables oficiales de Supabase Auth. No dependen de imágenes externas.

## Plantillas y asuntos

| Plantilla de Supabase | Asunto | Archivo |
| --- | --- | --- |
| Confirm signup | `Confirma tu correo | Mangata` | `confirmation.html` |
| Invite user | `Has sido invitado a Mangata` | `invite.html` |
| Magic link | `Accede a Mangata de forma segura` | `magic-link.html` |
| Change email address | `Confirma tu nuevo correo | Mangata` | `email-change.html` |
| Reset password | `Restablece tu contraseña | Mangata` | `recovery.html` |
| Reauthentication | `{{ .Token }} es tu código de verificación | Mangata` | `reauthentication.html` |
| Password changed notification | `Tu contraseña fue actualizada | Mangata` | `password-changed-notification.html` |

La notificación de contraseña modificada permanece desactivada porque el proyecto no la tenía habilitada. La confirmación de registro también conserva su comportamiento actual (`enable_confirmations = false`).

## Aplicación en el proyecto alojado

1. Iniciar sesión en el proyecto `dvgqzamhjxpyondzhynj`.
2. Abrir **Authentication > Email Templates**.
3. Elegir cada plantilla, copiar el asunto indicado y pegar el contenido completo del archivo HTML correspondiente.
4. Guardar cada plantilla sin sustituir `{{ .ConfirmationURL }}` ni `{{ .Token }}`.
5. En **Authentication > URL Configuration**, verificar:
   - Site URL: la URL pública real de la aplicación cuando exista.
   - Redirect URL de desarrollo: `http://127.0.0.1:4200/restablecer-contrasena`.
   - Redirect URL alternativa: `http://localhost:4200/restablecer-contrasena`.
   - Agregar también `<URL_PUBLICA>/restablecer-contrasena` cuando se despliegue la aplicación.

No se debe ejecutar `supabase config push` con la configuración local para actualizar solo los correos: ese comando también puede reemplazar otros ajustes de Auth del proyecto alojado. Para automatizarlo de forma segura se requiere un Personal Access Token y una actualización limitada a los campos `mailer_subjects_*` y `mailer_templates_*` mediante la Management API.

## SMTP y remitente

La configuración actual no contiene SMTP personalizado. Mientras no se configure uno, Supabase utilizará su servicio de correo predeterminado y sus límites. Para producción se recomienda configurar un proveedor SMTP en **Project Settings > Authentication > SMTP Settings**, con un remitente verificable como `Mangata <no-reply@dominio-verificado.cl>`. No se debe guardar la contraseña SMTP en este repositorio ni en archivos `environment.ts`.

## Prueba práctica

1. Abrir `/recuperar-contrasena` en Angular.
2. Solicitar la recuperación para una cuenta de prueba cuyo buzón se controle.
3. Comprobar asunto, remitente, carpeta de correo no deseado y visualización en escritorio/móvil.
4. Pulsar **Restablecer contraseña** y confirmar que abre `/restablecer-contrasena` con una sesión de recuperación válida.
5. Guardar una contraseña válida, comprobar el cierre de sesión automático e iniciar sesión con la contraseña nueva.
