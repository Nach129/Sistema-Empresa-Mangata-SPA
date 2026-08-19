-- ============================================================
-- MANGATA SPA
-- Esquema inicial
-- ============================================================

-- ============================================================
-- PERFIL
-- ============================================================

create table public.perfil (
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    nombre varchar(100) not null,
    apellido varchar(100) not null,

    rut varchar(12) not null unique,
    correo varchar(150) not null unique,

    telefono varchar(20),

    rol varchar(30) not null
        check (
            rol in (
                'ADMINISTRADOR',
                'TRABAJADOR',
                'CLIENTE'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- PRODUCTO
-- ============================================================

create table public.producto (
    id bigint generated always as identity primary key,

    nombre varchar(150) not null,
    descripcion text,

    categoria varchar(50) not null
        check (
            categoria in (
                'TROFEO',
                'MEDALLA',
                'PLACA',
                'FIGURA_3D',
                'LLAVERO',
                'OTRO'
            )
        ),

    material varchar(100),

    precio_base numeric(12,0) not null default 0
        check (precio_base >= 0),

    imagen_url text,

    activo boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- PEDIDO
-- ============================================================

create table public.pedido (
    id bigint generated always as identity primary key,

    numero_pedido varchar(30) not null unique,

    cliente_id uuid not null
        references public.perfil(id)
        on delete restrict,

    estado varchar(30) not null default 'RECIBIDO'
        check (
            estado in (
                'RECIBIDO',
                'EN_REVISION',
                'EN_PRODUCCION',
                'LISTO',
                'ENTREGADO',
                'CANCELADO'
            )
        ),

    fecha_solicitud date not null default current_date,

    fecha_entrega date,

    total numeric(12,0) not null default 0
        check (total >= 0),

    observaciones text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint chk_pedido_fecha_entrega
        check (
            fecha_entrega is null
            or fecha_entrega >= fecha_solicitud
        )
);


-- ============================================================
-- DETALLE PEDIDO
-- ============================================================

create table public.detalle_pedido (
    id bigint generated always as identity primary key,

    pedido_id bigint not null
        references public.pedido(id)
        on delete cascade,

    producto_id bigint not null
        references public.producto(id)
        on delete restrict,

    cantidad integer not null
        check (cantidad > 0),

    precio_unitario numeric(12,0) not null
        check (precio_unitario >= 0),

    subtotal numeric(12,0) not null
        check (subtotal >= 0),

    personalizacion text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- HISTORIAL PEDIDO
-- ============================================================

create table public.historial_pedido (
    id bigint generated always as identity primary key,

    pedido_id bigint not null
        references public.pedido(id)
        on delete cascade,

    usuario_id uuid not null
        references public.perfil(id)
        on delete restrict,

    estado_anterior varchar(30),

    estado_nuevo varchar(30) not null
        check (
            estado_nuevo in (
                'RECIBIDO',
                'EN_REVISION',
                'EN_PRODUCCION',
                'LISTO',
                'ENTREGADO',
                'CANCELADO'
            )
        ),

    observacion text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_pedido_cliente
    on public.pedido(cliente_id);

create index idx_pedido_estado
    on public.pedido(estado);

create index idx_pedido_fecha_solicitud
    on public.pedido(fecha_solicitud);

create index idx_detalle_pedido
    on public.detalle_pedido(pedido_id);

create index idx_detalle_producto
    on public.detalle_pedido(producto_id);

create index idx_historial_pedido
    on public.historial_pedido(pedido_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.perfil
enable row level security;

alter table public.producto
enable row level security;

alter table public.pedido
enable row level security;

alter table public.detalle_pedido
enable row level security;

alter table public.historial_pedido
enable row level security;