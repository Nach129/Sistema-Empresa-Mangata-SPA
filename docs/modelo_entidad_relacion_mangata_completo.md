# Modelo Entidad–Relación
## Sistema Empresa Mangata SPA

## 1. Descripción general

El sistema utilizará una base de datos relacional PostgreSQL administrada mediante Supabase.

El modelo inicial estará compuesto por cinco tablas:

1. `perfil`
2. `producto`
3. `pedido`
4. `detalle_pedido`
5. `historial_pedido`

Estas tablas permitirán administrar usuarios, productos, pedidos, productos incluidos en cada pedido y los cambios de estado realizados durante el proceso.

---

## 2. Diagrama entidad–relación

```mermaid
erDiagram
    PERFIL ||--o{ PEDIDO : realiza
    PERFIL ||--o{ HISTORIAL_PEDIDO : registra
    PEDIDO ||--|{ DETALLE_PEDIDO : contiene
    PRODUCTO ||--o{ DETALLE_PEDIDO : aparece_en
    PEDIDO ||--o{ HISTORIAL_PEDIDO : genera

    PERFIL {
        string id PK
        string nombre
        string apellido
        string rut UK
        string correo UK
        string telefono
        string rol
        datetime created_at
        datetime updated_at
    }

    PRODUCTO {
        int id PK
        string nombre
        string descripcion
        string categoria
        string material
        float precio_base
        string imagen_url
        boolean activo
        datetime created_at
        datetime updated_at
    }

    PEDIDO {
        int id PK
        string numero_pedido UK
        string cliente_id FK
        string estado
        date fecha_solicitud
        date fecha_entrega
        float total
        string observaciones
        datetime created_at
        datetime updated_at
    }

    DETALLE_PEDIDO {
        int id PK
        int pedido_id FK
        int producto_id FK
        int cantidad
        float precio_unitario
        float subtotal
        string personalizacion
        datetime created_at
    }

    HISTORIAL_PEDIDO {
        int id PK
        int pedido_id FK
        string usuario_id FK
        string estado_anterior
        string estado_nuevo
        string observacion
        datetime created_at
    }
```

> Nota: Mermaid utiliza tipos simplificados como `string`, `int`, `float` y `datetime` para mostrar correctamente el diagrama. En PostgreSQL se usarán los tipos técnicos indicados en las tablas siguientes.

---

## 3. Entidades

### 3.1. Tabla `perfil`

Almacena los datos complementarios de las personas registradas en el sistema.

El campo `id` utilizará el mismo identificador generado por Supabase Auth en `auth.users.id`.

| Campo | Tipo PostgreSQL | Restricción | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, FK a `auth.users(id)` | Identificador único del usuario |
| `nombre` | `varchar(100)` | NOT NULL | Nombre del usuario |
| `apellido` | `varchar(100)` | NOT NULL | Apellido del usuario |
| `rut` | `varchar(12)` | UNIQUE, NOT NULL | RUT del usuario |
| `correo` | `varchar(150)` | UNIQUE, NOT NULL | Correo electrónico |
| `telefono` | `varchar(20)` | NULL | Teléfono de contacto |
| `rol` | `varchar(30)` | NOT NULL | Rol dentro del sistema |
| `created_at` | `timestamptz` | DEFAULT `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Fecha de última actualización |

#### Roles iniciales

- `ADMINISTRADOR`
- `TRABAJADOR`
- `CLIENTE`

---

### 3.2. Tabla `producto`

Contiene el catálogo de productos ofrecidos por Mangata Design SPA.

| Campo | Tipo PostgreSQL | Restricción | Descripción |
|---|---|---|---|
| `id` | `bigint` | PK, IDENTITY | Identificador del producto |
| `nombre` | `varchar(150)` | NOT NULL | Nombre del producto |
| `descripcion` | `text` | NULL | Descripción del producto |
| `categoria` | `varchar(50)` | NOT NULL | Categoría del producto |
| `material` | `varchar(100)` | NULL | Material principal |
| `precio_base` | `numeric(12,0)` | NOT NULL, CHECK `>= 0` | Precio referencial |
| `imagen_url` | `text` | NULL | URL de la imagen almacenada |
| `activo` | `boolean` | DEFAULT `true` | Indica si puede utilizarse en nuevos pedidos |
| `created_at` | `timestamptz` | DEFAULT `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Fecha de última actualización |

#### Categorías iniciales

- `TROFEO`
- `MEDALLA`
- `PLACA`
- `FIGURA_3D`
- `LLAVERO`
- `OTRO`

---

### 3.3. Tabla `pedido`

Registra la información general de cada pedido realizado por un cliente.

| Campo | Tipo PostgreSQL | Restricción | Descripción |
|---|---|---|---|
| `id` | `bigint` | PK, IDENTITY | Identificador interno |
| `numero_pedido` | `varchar(30)` | UNIQUE, NOT NULL | Código visible del pedido |
| `cliente_id` | `uuid` | FK, NOT NULL | Cliente que realizó el pedido |
| `estado` | `varchar(30)` | NOT NULL | Estado actual del pedido |
| `fecha_solicitud` | `date` | NOT NULL | Fecha de ingreso |
| `fecha_entrega` | `date` | NULL | Fecha estimada o real de entrega |
| `total` | `numeric(12,0)` | DEFAULT `0`, CHECK `>= 0` | Total del pedido |
| `observaciones` | `text` | NULL | Información adicional |
| `created_at` | `timestamptz` | DEFAULT `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Fecha de última actualización |

#### Estados iniciales

- `RECIBIDO`
- `EN_REVISION`
- `EN_PRODUCCION`
- `LISTO`
- `ENTREGADO`
- `CANCELADO`

---

### 3.4. Tabla `detalle_pedido`

Representa cada producto incluido dentro de un pedido.

Un pedido puede tener uno o varios registros en `detalle_pedido`. Cada registro representa un solo producto, junto con su cantidad, precio y personalización.

| Campo | Tipo PostgreSQL | Restricción | Descripción |
|---|---|---|---|
| `id` | `bigint` | PK, IDENTITY | Identificador del detalle |
| `pedido_id` | `bigint` | FK, NOT NULL | Pedido asociado |
| `producto_id` | `bigint` | FK, NOT NULL | Producto solicitado |
| `cantidad` | `integer` | NOT NULL, CHECK `> 0` | Cantidad solicitada |
| `precio_unitario` | `numeric(12,0)` | NOT NULL, CHECK `>= 0` | Precio usado en el pedido |
| `subtotal` | `numeric(12,0)` | NOT NULL, CHECK `>= 0` | Resultado de cantidad por precio unitario |
| `personalizacion` | `text` | NULL | Indicaciones especiales |
| `created_at` | `timestamptz` | DEFAULT `now()` | Fecha de creación |

#### Regla de cálculo

```text
subtotal = cantidad × precio_unitario
```

El precio unitario se guarda en el detalle para mantener el valor utilizado al crear el pedido, aunque después cambie el precio base del producto.

---

### 3.5. Tabla `historial_pedido`

Mantiene la trazabilidad de los cambios de estado realizados sobre cada pedido.

| Campo | Tipo PostgreSQL | Restricción | Descripción |
|---|---|---|---|
| `id` | `bigint` | PK, IDENTITY | Identificador del registro |
| `pedido_id` | `bigint` | FK, NOT NULL | Pedido modificado |
| `usuario_id` | `uuid` | FK, NOT NULL | Usuario responsable |
| `estado_anterior` | `varchar(30)` | NULL | Estado previo |
| `estado_nuevo` | `varchar(30)` | NOT NULL | Nuevo estado |
| `observacion` | `text` | NULL | Motivo o comentario |
| `created_at` | `timestamptz` | DEFAULT `now()` | Fecha y hora del cambio |

---

## 4. Relaciones y cardinalidades

### 4.1. `perfil` — `pedido`

```text
perfil 1 ─── 0..N pedido
```

- Un perfil con rol `CLIENTE` puede realizar cero, uno o muchos pedidos.
- Cada pedido debe pertenecer a un único cliente.
- Clave foránea: `pedido.cliente_id`.
- Referencia: `perfil.id`.

---

### 4.2. `pedido` — `detalle_pedido`

```text
pedido 1 ─── 1..N detalle_pedido
```

- Un pedido debe contener al menos un detalle.
- Un pedido puede incluir varios productos.
- Cada detalle pertenece a un único pedido.
- Clave foránea: `detalle_pedido.pedido_id`.
- Referencia: `pedido.id`.

Ejemplo:

```text
PED-001
├── 2 trofeos
├── 5 medallas
└── 1 placa
```

En este ejemplo existe un pedido y tres registros en `detalle_pedido`.

---

### 4.3. `producto` — `detalle_pedido`

```text
producto 1 ─── 0..N detalle_pedido
```

- Un producto puede no haber sido solicitado todavía.
- Un producto puede aparecer en muchos pedidos.
- Cada detalle corresponde a un único producto.
- Clave foránea: `detalle_pedido.producto_id`.
- Referencia: `producto.id`.

---

### 4.4. `pedido` — `producto`

```text
pedido N ─── M producto
```

La relación muchos a muchos entre pedido y producto se resuelve mediante `detalle_pedido`.

- Un pedido puede contener varios productos.
- Un producto puede aparecer en varios pedidos.
- `detalle_pedido` guarda cantidad, precio unitario, subtotal y personalización.

---

### 4.5. `pedido` — `historial_pedido`

```text
pedido 1 ─── 0..N historial_pedido
```

- Un pedido puede tener cero o varios cambios registrados.
- Cada registro del historial pertenece a un único pedido.
- Clave foránea: `historial_pedido.pedido_id`.
- Referencia: `pedido.id`.

---

### 4.6. `perfil` — `historial_pedido`

```text
perfil 1 ─── 0..N historial_pedido
```

- Un usuario puede realizar varios cambios de estado.
- Cada cambio debe registrar al usuario responsable.
- Clave foránea: `historial_pedido.usuario_id`.
- Referencia: `perfil.id`.

---


## 5. Consultas que permitirá el modelo

El modelo permitirá obtener:

- Pedidos realizados por cada cliente.
- Productos incluidos en un pedido.
- Productos más solicitados.
- Pedidos agrupados por estado.
- Pedidos realizados por mes.
- Total de ventas por periodo.
- Clientes con mayor cantidad de pedidos.
- Historial completo de cada pedido.
- Usuario que realizó cada cambio de estado.
- Pedidos pendientes, entregados o cancelados.

El módulo de reportes no necesita una tabla propia, porque obtendrá la información mediante consultas sobre estas cinco tablas.

---
