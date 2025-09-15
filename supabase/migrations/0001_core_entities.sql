-- 0001_core_entities.sql
-- Esquema principal (clientes, ventas, cotizaciones, facturas, proveedores, productos, órdenes, detalle, cobranzas)

-- Extensiones necesarias
create extension if not exists pgcrypto; -- para gen_random_uuid()

-- 1) Clientes
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique,
  telefono text,
  direccion text,
  created_at timestamptz default now()
);

-- 2) Ventas
-- Una venta puede estar asociada a un cliente y tener facturación
create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  fecha date not null default now(),
  total numeric(12,2) not null default 0,
  estado text check (estado in ('pendiente','pagada','cancelada')),
  created_at timestamptz default now()
);
create index if not exists ventas_cliente_idx on public.ventas(cliente_id);

-- 3) Cotizaciones
-- Relacionadas a un cliente, opcionalmente se convierten en ventas
create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  fecha date default now(),
  total numeric(12,2),
  estado text check (estado in ('abierta','aprobada','rechazada')),
  venta_id uuid references public.ventas(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists cotizaciones_cliente_idx on public.cotizaciones(cliente_id);
create index if not exists cotizaciones_venta_idx on public.cotizaciones(venta_id);

-- 4) Facturación
-- Se asocia directamente a una venta
create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid references public.ventas(id) on delete cascade,
  numero_factura text unique not null,
  fecha date not null default now(),
  monto numeric(12,2) not null,
  estado text check (estado in ('emitida','pagada','vencida')),
  created_at timestamptz default now()
);
create index if not exists facturas_venta_idx on public.facturas(venta_id);

-- 5) Proveedores
create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text,
  telefono text,
  direccion text,
  created_at timestamptz default now()
);

-- 6) Productos
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(12,2) not null,
  stock int default 0,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists productos_proveedor_idx on public.productos(proveedor_id);

-- 7) Órdenes de compra
-- Relacionadas a proveedores
create table if not exists public.ordenes (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid references public.proveedores(id) on delete set null,
  fecha date default now(),
  estado text check (estado in ('pendiente','recibida','cancelada')),
  total numeric(12,2),
  created_at timestamptz default now()
);
create index if not exists ordenes_proveedor_idx on public.ordenes(proveedor_id);

-- 8) Detalle de órdenes (muchos productos en una orden)
create table if not exists public.orden_detalle (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid references public.ordenes(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete restrict,
  cantidad int not null,
  precio_unitario numeric(12,2) not null,
  subtotal numeric(12,2) generated always as (cantidad * precio_unitario) stored
);
create index if not exists orden_detalle_orden_idx on public.orden_detalle(orden_id);
create index if not exists orden_detalle_producto_idx on public.orden_detalle(producto_id);

-- 9) Cobranzas (Cuentas Corrientes)
-- Ligadas a clientes y facturas
create table if not exists public.cobranzas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  factura_id uuid references public.facturas(id) on delete cascade,
  fecha date default now(),
  monto numeric(12,2) not null,
  metodo_pago text check (metodo_pago in ('efectivo','transferencia','tarjeta')),
  created_at timestamptz default now()
);
create index if not exists cobranzas_cliente_idx on public.cobranzas(cliente_id);
create index if not exists cobranzas_factura_idx on public.cobranzas(factura_id);

-- Notas:
-- • Ajusta RLS (Row Level Security) y políticas según tu necesidad.
-- • Si prefieres uuid_generate_v4(), habilita la extensión "uuid-ossp" y cambia los defaults.
-- • Este archivo no elimina las tablas existentes; se puede ejecutar de forma incremental.

