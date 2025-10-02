-- =====================================================
-- Migration: Tabla de Cotizaciones
-- =====================================================

-- Crear tabla cotizaciones
create table if not exists public.cotizaciones (
  id text primary key,
  cliente_nombre text not null,
  cliente_email text,
  fecha date not null default current_date,
  validez_dias integer not null default 15,
  notas text,
  subtotal numeric(12,2) not null default 0,
  iva numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete set null
);

-- Índices para búsqueda rápida
create index if not exists idx_cotizaciones_cliente on cotizaciones(cliente_nombre);
create index if not exists idx_cotizaciones_fecha on cotizaciones(fecha desc);
create index if not exists idx_cotizaciones_user_id on cotizaciones(user_id);

-- Función para obtener cotizaciones con filtros
create or replace function public.get_cotizaciones(
  p_busqueda text default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_limite integer default 50,
  p_desplazamiento integer default 0
)
returns table(
  id text,
  cliente_nombre text,
  cliente_email text,
  fecha date,
  validez_dias integer,
  notas text,
  subtotal numeric,
  iva numeric,
  total numeric,
  items jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
as $$
begin
  return query
  select
    c.id,
    c.cliente_nombre,
    c.cliente_email,
    c.fecha,
    c.validez_dias,
    c.notas,
    c.subtotal,
    c.iva,
    c.total,
    c.items,
    c.created_at,
    c.updated_at
  from
    cotizaciones c
  where
    (p_busqueda is null or
     c.cliente_nombre ilike ('%' || p_busqueda || '%') or
     c.id ilike ('%' || p_busqueda || '%') or
     c.notas ilike ('%' || p_busqueda || '%')
    )
    and (p_fecha_desde is null or c.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or c.fecha <= p_fecha_hasta)
  order by
    c.fecha desc, c.created_at desc
  limit p_limite
  offset p_desplazamiento;
end;
$$ language plpgsql stable;

-- Función para obtener estadísticas de cotizaciones
create or replace function public.get_cotizaciones_stats()
returns table(
  total_cotizaciones bigint,
  cotizaciones_mes bigint,
  valor_total_mes numeric,
  promedio_por_cotizacion numeric
)
as $$
begin
  return query
  select
    count(*) as total_cotizaciones,
    count(*) filter (where fecha >= date_trunc('month', current_date)) as cotizaciones_mes,
    coalesce(sum(total) filter (where fecha >= date_trunc('month', current_date)), 0) as valor_total_mes,
    coalesce(avg(total) filter (where fecha >= date_trunc('month', current_date)), 0) as promedio_por_cotizacion
  from cotizaciones;
end;
$$ language plpgsql stable;

-- Políticas RLS
alter table public.cotizaciones enable row level security;

-- Política para lectura (usuarios autenticados pueden ver todas las cotizaciones)
create policy "Cotizaciones visibles para usuarios autenticados"
  on public.cotizaciones for select
  using (auth.role() = 'authenticated');

-- Política para inserción/actualización (usuarios autenticados pueden gestionar sus cotizaciones)
create policy "Usuarios autenticados pueden gestionar cotizaciones"
  on public.cotizaciones for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Trigger para updated_at
create trigger set_updated_at_cotizaciones
  before update on public.cotizaciones
  for each row
  execute function public.handle_updated_at();

-- Comentarios
comment on table public.cotizaciones is 'Cotizaciones generadas por el sistema';
comment on column public.cotizaciones.items is 'Array JSON con los productos de la cotización';
comment on function public.get_cotizaciones is 'Obtiene cotizaciones con filtros opcionales';
comment on function public.get_cotizaciones_stats is 'Obtiene estadísticas generales de cotizaciones';
