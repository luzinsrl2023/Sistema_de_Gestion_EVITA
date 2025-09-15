-- 0002_performance_indexes.sql
-- Ventas: filtros por estado/fecha
create index if not exists ventas_estado_fecha_idx on public.ventas(estado, fecha);
create index if not exists ventas_fecha_idx on public.ventas(fecha);
-- Facturas: reportes por estado/fecha
create index if not exists facturas_estado_fecha_idx on public.facturas(estado, fecha);
create index if not exists facturas_fecha_idx on public.facturas(fecha);
-- Productos: búsquedas por nombre y reportes por fecha/stock
create index if not exists productos_nombre_lower_idx on public.productos (lower(nombre));
create index if not exists productos_stock_idx on public.productos (stock);
create index if not exists productos_created_at_idx on public.productos (created_at);
-- Clientes: búsquedas por nombre
create index if not exists clientes_nombre_lower_idx on public.clientes (lower(nombre));
-- Cobranzas: listados por fecha
create index if not exists cobranzas_fecha_idx on public.cobranzas (fecha);