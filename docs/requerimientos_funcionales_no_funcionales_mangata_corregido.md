# Requerimientos Funcionales y No Funcionales
## Sistema Empresa Mangata SPA

## 1. Requerimientos Funcionales

Definen las funciones principales que deberá proporcionar el sistema.

| ID Requerimiento | Descripción del Requerimiento Funcional (RF) |
| :--- | :--- |
| **RF-01 Gestionar usuarios** | El sistema deberá permitir registrar usuarios, iniciar sesión, cerrar sesión, actualizar sus datos y asignar roles. |
| **RF-02 Gestionar productos** | El sistema deberá permitir registrar, consultar, modificar y desactivar productos del catálogo. |
| **RF-03 Registrar pedidos** | El sistema deberá permitir crear pedidos asociados a un cliente, incorporando uno o varios productos, cantidades, precios y observaciones. |
| **RF-04 Consultar pedidos** | El sistema deberá permitir listar, buscar y visualizar el detalle de los pedidos registrados. |
| **RF-05 Modificar pedidos** | El sistema deberá permitir actualizar la información de un pedido mientras este no haya sido entregado o cancelado. |
| **RF-06 Actualizar estado del pedido** | El sistema deberá permitir cambiar el estado de un pedido entre recibido, en revisión, en producción, listo, entregado o cancelado. |
| **RF-07 Registrar historial del pedido** | El sistema deberá guardar automáticamente cada cambio de estado, indicando fecha, usuario responsable y observación. |
| **RF-08 Calcular totales** | El sistema deberá calcular automáticamente el subtotal de cada producto y el total general del pedido. |
| **RF-09 Consultar historial del cliente** | El sistema deberá permitir visualizar los pedidos realizados anteriormente por cada cliente. |
| **RF-10 Visualizar reportes** | El sistema deberá mostrar reportes y estadísticas sobre pedidos, productos y ventas. |
| **RF-11 Filtrar reportes** | El sistema deberá permitir filtrar los reportes por fecha, estado del pedido o producto. |
| **RF-12 Visualizar gráficos** | El sistema deberá representar la información mediante gráficos de pedidos por estado, productos más solicitados y ventas por periodo. |

---

## 2. Requerimientos No Funcionales

Definen los atributos de calidad, seguridad y operación del sistema.

| ID Requerimiento | Descripción del Requerimiento No Funcional (RNF) |
| :--- | :--- |
| **RNF-01 Acceso mediante internet** | El sistema deberá estar disponible desde equipos con conexión a internet mediante un navegador web. |
| **RNF-02 Sistema en la nube** | La aplicación y la base de datos deberán estar alojadas en servicios en la nube. |
| **RNF-03 Control de acceso** | Cada usuario deberá ingresar mediante credenciales personales. |
| **RNF-04 Control por roles** | El sistema deberá limitar las funcionalidades disponibles según el rol del usuario. |
| **RNF-05 Protección de datos** | La información de usuarios, productos y pedidos deberá protegerse frente a accesos no autorizados. |
| **RNF-06 Registro de fecha y usuario** | Las operaciones importantes deberán almacenar automáticamente la fecha y el usuario responsable. |
| **RNF-07 Integridad de la información** | El sistema deberá evitar pedidos sin cliente, productos inexistentes o cantidades inválidas. |
| **RNF-08 Base de datos centralizada** | Toda la información deberá almacenarse en una única base de datos PostgreSQL administrada mediante Supabase. |
| **RNF-09 Interfaz sencilla** | La interfaz deberá ser clara y comprensible para usuarios con conocimientos básicos de computación. |
| **RNF-10 Validación de datos** | El sistema deberá informar cuando existan campos obligatorios vacíos o datos incorrectos. |
| **RNF-11 Tiempo de respuesta** | Las operaciones habituales deberán completarse en pocos segundos bajo condiciones normales de conexión. |
| **RNF-12 Disponibilidad** | El sistema deberá mantenerse disponible durante la jornada de trabajo de la empresa. |
| **RNF-13 Mantenibilidad** | El código deberá organizarse por módulos para facilitar correcciones y futuras mejoras. |
| **RNF-14 Escalabilidad** | El sistema deberá permitir incorporar nuevos usuarios, productos, pedidos y reportes sin modificar su estructura principal. |

