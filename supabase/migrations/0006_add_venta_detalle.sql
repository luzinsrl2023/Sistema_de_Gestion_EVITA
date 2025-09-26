-- 0006_add_venta_detalle.sql
-- Creación de la tabla venta_detalle para vincular productos a ventas.

-- 1) Tabla venta_detalle
-- Almacena los productos individuales que componen una venta.
create table if not exists public.venta_detalle (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid references public.ventas(id) on delete cascade not null,
  producto_id uuid references public.productos(id) on delete restrict not null,
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  subtotal numeric(12, 2) generated always as (cantidad * precio_unitario) stored
);

-- Índices para mejorar el rendimiento de las consultas
create index if not exists venta_detalle_venta_idx on public.venta_detalle(venta_id);
create index if not exists venta_detalle_producto_idx on public.venta_detalle(producto_id);

-- Comentarios para claridad del esquema
comment on table public.venta_detalle is 'Tabla de detalle para las ventas, vinculando productos específicos a una venta.';
comment on column public.venta_detalle.venta_id is 'Referencia a la venta principal.';
comment on column public.venta_detalle.producto_id is 'Referencia al producto vendido.';
comment on column public.venta_detalle.cantidad is 'Cantidad de unidades del producto vendidas.';
comment on column public.venta_detalle.precio_unitario is 'Precio del producto al momento de la venta.';
comment on column public.venta_detalle.subtotal is 'Cálculo automático de cantidad * precio_unitario.';

-- 2) Habilitar Row Level Security (RLS)
alter table public.venta_detalle enable row level security;

-- 3) Políticas de acceso
-- Permite a los usuarios autenticados realizar todas las operaciones.
-- En un entorno de producción, se deberían definir políticas más restrictivas.
create policy "Allow all on venta_detalle"
  on public.venta_detalle for all
  to authenticated
  using (true)
  with check (true);

-- 4) Actualizar la función getVentas para incluir los detalles
-- Esta es una función de ejemplo, la lógica real estará en el código de la aplicación.
-- La incluyo aquí para documentar el cambio necesario.
-- Nota: Las funciones de base de datos no son la forma en que la app accede a los datos,
-- pero sirve como referencia de la consulta a realizar.
-- La consulta a realizar desde el frontend será:
-- supabase.from('ventas').select('*, venta_detalle(*, productos(*))')