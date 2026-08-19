# Historias de Usuario
## Sistema Empresa Mangata SPA

**Formato de descripción:** *Como [rol], quiero [funcionalidad], para [beneficio]*.

**Criterios de aceptación:** redactados en estilo *Dado / Cuando / Entonces* para el flujo principal, junto con condiciones adicionales verificables.

---

## Módulo de Usuarios

### HU-01 — Iniciar sesión

- **ID:** HU-01
- **Requerimiento asociado:** RF-01
- **Rol:** Usuario
- **Descripción:** Como usuario, quiero iniciar sesión con mis credenciales, para acceder a las funcionalidades permitidas según mi rol.
- **Criterios de aceptación:**
  - Dado un usuario registrado, cuando ingresa credenciales válidas, entonces el sistema permite el acceso.
  - Si las credenciales son incorrectas, el sistema muestra un mensaje de error.
  - El sistema debe mantener la sesión activa hasta que el usuario cierre sesión.

### HU-02 — Registrar usuario

- **ID:** HU-02
- **Requerimiento asociado:** RF-01
- **Rol:** Administrador
- **Descripción:** Como administrador, quiero registrar nuevos usuarios, para permitirles utilizar el sistema.
- **Criterios de aceptación:**
  - Dado un administrador autenticado, cuando completa los datos obligatorios y confirma, entonces el sistema registra al usuario.
  - El correo y el RUT no pueden repetirse.
  - El sistema debe permitir asignar un rol al nuevo usuario.

### HU-03 — Editar perfil de usuario

- **ID:** HU-03
- **Requerimiento asociado:** RF-01
- **Rol:** Usuario
- **Descripción:** Como usuario, quiero actualizar mis datos personales, para mantener mi información de contacto vigente.
- **Criterios de aceptación:**
  - Dado un usuario autenticado, cuando modifica sus datos y guarda, entonces el sistema actualiza la información.
  - El sistema debe validar los campos obligatorios antes de guardar.
  - El usuario no puede modificar su propio rol.

### HU-04 — Cerrar sesión

- **ID:** HU-04
- **Requerimiento asociado:** RF-01
- **Rol:** Usuario
- **Descripción:** Como usuario, quiero cerrar sesión, para proteger el acceso a mi cuenta cuando termine de utilizar el sistema.
- **Criterios de aceptación:**
  - Dado un usuario autenticado, cuando selecciona cerrar sesión, entonces el sistema finaliza su sesión.
  - Después de cerrar sesión, las rutas privadas no deben quedar disponibles.

---

## Módulo de Productos

### HU-05 — Registrar producto

- **ID:** HU-05
- **Requerimiento asociado:** RF-02
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero registrar un producto, para incorporarlo al catálogo de la empresa.
- **Criterios de aceptación:**
  - Dado un usuario autorizado, cuando ingresa los datos obligatorios y confirma, entonces el sistema registra el producto.
  - El producto debe incluir nombre, categoría y precio base.
  - El precio base no puede ser negativo.

### HU-06 — Consultar productos

- **ID:** HU-06
- **Requerimiento asociado:** RF-02
- **Rol:** Usuario
- **Descripción:** Como usuario, quiero consultar los productos registrados, para conocer el catálogo disponible.
- **Criterios de aceptación:**
  - Dado un usuario autenticado, cuando accede al módulo, entonces el sistema muestra los productos registrados.
  - El listado debe permitir buscar por nombre.
  - El listado debe permitir filtrar por categoría.

### HU-07 — Modificar producto

- **ID:** HU-07
- **Requerimiento asociado:** RF-02
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero modificar los datos de un producto, para mantener el catálogo actualizado.
- **Criterios de aceptación:**
  - Dado un producto existente, cuando el usuario modifica sus datos y confirma, entonces el sistema guarda los cambios.
  - El sistema debe validar nombre, categoría y precio base.
  - La fecha de actualización debe registrarse automáticamente.

### HU-08 — Desactivar producto

- **ID:** HU-08
- **Requerimiento asociado:** RF-02
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero desactivar un producto, para evitar que sea agregado a nuevos pedidos sin eliminar su información histórica.
- **Criterios de aceptación:**
  - Dado un producto registrado, cuando el usuario lo desactiva, entonces deja de estar disponible para nuevos pedidos.
  - El producto debe conservarse en los pedidos históricos.
  - El sistema debe permitir volver a activarlo posteriormente.

---

## Módulo de Pedidos

### HU-09 — Registrar pedido

- **ID:** HU-09
- **Requerimiento asociado:** RF-03
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero registrar un pedido asociado a un cliente, para documentar la solicitud realizada.
- **Criterios de aceptación:**
  - Dado un usuario autenticado, cuando selecciona un cliente, agrega al menos un producto y confirma, entonces el sistema registra el pedido.
  - El pedido debe generar un número único.
  - El sistema debe registrar automáticamente la fecha de solicitud.

### HU-10 — Agregar productos al pedido

- **ID:** HU-10
- **Requerimiento asociado:** RF-03, RF-08
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero agregar productos, cantidades y personalizaciones a un pedido, para representar correctamente lo solicitado por el cliente.
- **Criterios de aceptación:**
  - Dado un pedido en creación, cuando se agrega un producto con una cantidad válida, entonces el sistema incorpora un detalle al pedido.
  - La cantidad debe ser mayor que cero.
  - El sistema debe calcular automáticamente el subtotal de cada detalle.

### HU-11 — Consultar pedidos

- **ID:** HU-11
- **Requerimiento asociado:** RF-04
- **Rol:** Usuario
- **Descripción:** Como usuario, quiero consultar los pedidos registrados, para revisar su información y estado actual.
- **Criterios de aceptación:**
  - Dado un usuario autenticado, cuando accede al módulo, entonces el sistema muestra los pedidos registrados.
  - El listado debe permitir buscar por número de pedido o cliente.
  - El listado debe permitir filtrar por estado.

### HU-12 — Ver detalle de pedido

- **ID:** HU-12
- **Requerimiento asociado:** RF-04
- **Rol:** Usuario
- **Descripción:** Como usuario, quiero visualizar el detalle completo de un pedido, para revisar sus productos, cantidades, total y observaciones.
- **Criterios de aceptación:**
  - Dado un pedido existente, cuando el usuario lo selecciona, entonces el sistema muestra su información general y sus detalles.
  - El sistema debe mostrar el cliente, estado, fechas, productos, cantidades, subtotales y total.
  - El sistema debe mostrar el historial de cambios de estado.

### HU-13 — Modificar pedido

- **ID:** HU-13
- **Requerimiento asociado:** RF-05
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero modificar un pedido, para corregir o actualizar su información antes de que sea entregado o cancelado.
- **Criterios de aceptación:**
  - Dado un pedido vigente, cuando el usuario modifica sus datos y confirma, entonces el sistema guarda los cambios.
  - Un pedido entregado o cancelado no debe permitir modificaciones.
  - El total debe actualizarse si cambian sus productos o cantidades.

### HU-14 — Actualizar estado del pedido

- **ID:** HU-14
- **Requerimiento asociado:** RF-06, RF-07
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero actualizar el estado de un pedido, para reflejar su avance dentro del proceso.
- **Criterios de aceptación:**
  - Dado un pedido registrado, cuando el usuario selecciona un nuevo estado y confirma, entonces el sistema actualiza el pedido.
  - Los estados disponibles serán: recibido, en revisión, en producción, listo, entregado y cancelado.
  - Cada cambio debe registrar el estado anterior, estado nuevo, fecha, usuario y observación.

### HU-15 — Consultar historial del cliente

- **ID:** HU-15
- **Requerimiento asociado:** RF-09
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero consultar los pedidos anteriores de un cliente, para revisar su historial de solicitudes.
- **Criterios de aceptación:**
  - Dado un cliente registrado, cuando el usuario consulta su historial, entonces el sistema muestra sus pedidos ordenados por fecha.
  - El historial debe mostrar número de pedido, estado, fecha y total.
  - Si el cliente no tiene pedidos, el sistema debe indicarlo claramente.

---

## Módulo de Reportes

### HU-16 — Visualizar indicadores generales

- **ID:** HU-16
- **Requerimiento asociado:** RF-10
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero visualizar indicadores generales, para conocer rápidamente la situación de los pedidos y ventas.
- **Criterios de aceptación:**
  - Dado un usuario autorizado, cuando accede al módulo de reportes, entonces el sistema muestra el total de pedidos, pedidos pendientes, pedidos entregados y total de ventas.
  - Los indicadores deben calcularse a partir de los datos registrados.
  - La información debe actualizarse al volver a cargar el reporte.

### HU-17 — Visualizar pedidos por estado

- **ID:** HU-17
- **Requerimiento asociado:** RF-10, RF-12
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero visualizar un gráfico de pedidos por estado, para conocer la distribución de los pedidos.
- **Criterios de aceptación:**
  - Dado que existen pedidos registrados, cuando el usuario abre el reporte, entonces el sistema muestra la cantidad correspondiente a cada estado.
  - El gráfico debe diferenciar claramente cada estado.
  - Los valores del gráfico deben coincidir con los datos almacenados.

### HU-18 — Visualizar productos más solicitados

- **ID:** HU-18
- **Requerimiento asociado:** RF-10, RF-12
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero visualizar los productos más solicitados, para identificar cuáles tienen mayor demanda.
- **Criterios de aceptación:**
  - Dado que existen detalles de pedidos, cuando el usuario consulta el reporte, entonces el sistema muestra los productos ordenados por cantidad solicitada.
  - El cálculo debe considerar la suma de las cantidades registradas.
  - El reporte debe mostrar al menos el nombre del producto y la cantidad total.

### HU-19 — Visualizar ventas por periodo

- **ID:** HU-19
- **Requerimiento asociado:** RF-10, RF-11, RF-12
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero visualizar las ventas por periodo, para analizar su evolución en el tiempo.
- **Criterios de aceptación:**
  - Dado que existen pedidos registrados, cuando el usuario selecciona un rango de fechas, entonces el sistema muestra el total de ventas correspondiente.
  - El sistema debe permitir agrupar la información por mes.
  - Los pedidos cancelados no deben considerarse como ventas.

### HU-20 — Filtrar reportes

- **ID:** HU-20
- **Requerimiento asociado:** RF-11
- **Rol:** Usuario autorizado
- **Descripción:** Como usuario autorizado, quiero filtrar los reportes, para consultar únicamente la información relevante.
- **Criterios de aceptación:**
  - Dado un reporte disponible, cuando el usuario selecciona filtros y confirma, entonces el sistema actualiza los resultados.
  - Los filtros deben incluir rango de fechas, estado del pedido y producto.
  - El sistema debe permitir limpiar los filtros aplicados.

---

## Tabla de trazabilidad

| ID HU | Nombre | RF asociado | Módulo |
| :--- | :--- | :--- | :--- |
| HU-01 | Iniciar sesión | RF-01 | Usuarios |
| HU-02 | Registrar usuario | RF-01 | Usuarios |
| HU-03 | Editar perfil de usuario | RF-01 | Usuarios |
| HU-04 | Cerrar sesión | RF-01 | Usuarios |
| HU-05 | Registrar producto | RF-02 | Productos |
| HU-06 | Consultar productos | RF-02 | Productos |
| HU-07 | Modificar producto | RF-02 | Productos |
| HU-08 | Desactivar producto | RF-02 | Productos |
| HU-09 | Registrar pedido | RF-03 | Pedidos |
| HU-10 | Agregar productos al pedido | RF-03, RF-08 | Pedidos |
| HU-11 | Consultar pedidos | RF-04 | Pedidos |
| HU-12 | Ver detalle de pedido | RF-04 | Pedidos |
| HU-13 | Modificar pedido | RF-05 | Pedidos |
| HU-14 | Actualizar estado del pedido | RF-06, RF-07 | Pedidos |
| HU-15 | Consultar historial del cliente | RF-09 | Pedidos |
| HU-16 | Visualizar indicadores generales | RF-10 | Reportes |
| HU-17 | Visualizar pedidos por estado | RF-10, RF-12 | Reportes |
| HU-18 | Visualizar productos más solicitados | RF-10, RF-12 | Reportes |
| HU-19 | Visualizar ventas por periodo | RF-10, RF-11, RF-12 | Reportes |
| HU-20 | Filtrar reportes | RF-11 | Reportes |
