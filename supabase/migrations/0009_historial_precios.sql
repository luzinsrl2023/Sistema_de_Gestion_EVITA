-- =====================================================
-- Migration: Historial de Cambios de Precios
-- =====================================================

-- Tabla para registrar cambios de precios
create table if not exists public.historial_precios (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid references public.proveedores(id) on delete cascade,
  proveedor_nombre text not null,
  porcentaje_cambio numeric(5,2) not null,
  productos_afectados integer not null default 0,
  valor_anterior_promedio numeric(12,2),
  valor_nuevo_promedio numeric(12,2),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  created_at timestamptz default now()
);

-- Índices para búsqueda rápida
create index if not exists idx_historial_precios_proveedor on historial_precios(proveedor_id);
create index if not exists idx_historial_precios_fecha on historial_precios(created_at desc);
create index if not exists idx_historial_precios_user on historial_precios(user_id);

-- Función mejorada para actualizar precios con registro de historial
create or replace function public.actualizar_precios_proveedor_con_historial(
  p_proveedor_id uuid,
  p_porcentaje numeric,
  p_user_id uuid default null,
  p_user_email text default null
)
returns jsonb as $$
declare
  v_productos_count integer;
  v_promedio_anterior numeric;
  v_promedio_nuevo numeric;
  v_historial_id uuid;
  v_proveedor_nombre text;
begin
  -- Obtener nombre del proveedor
  select nombre into v_proveedor_nombre
  from proveedores
  where id = p_proveedor_id;

  if v_proveedor_nombre is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Proveedor no encontrado'
    );
  end if;

  -- Calcular promedio anterior
  select 
    count(*),
    avg(coalesce(precio, 0))
  into v_productos_count, v_promedio_anterior
  from productos
  where proveedor_id = p_proveedor_id;

  if v_productos_count = 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'No hay productos para este proveedor'
    );
  end if;

  -- Actualizar precios
  update productos
  set 
    precio = round(precio * (1 + p_porcentaje / 100), 2),
    updated_at = now()
  where proveedor_id = p_proveedor_id;

  -- Calcular promedio nuevo
  select avg(coalesce(precio, 0))
  into v_promedio_nuevo
  from productos
  where proveedor_id = p_proveedor_id;

  -- Registrar en historial
  insert into historial_precios (
    proveedor_id,
    proveedor_nombre,
    porcentaje_cambio,
    productos_afectados,
    valor_anterior_promedio,
    valor_nuevo_promedio,
    user_id,
    user_email
  ) values (
    p_proveedor_id,
    v_proveedor_nombre,
    p_porcentaje,
    v_productos_count,
    v_promedio_anterior,
    v_promedio_nuevo,
    p_user_id,
    p_user_email
  )
  returning id into v_historial_id;

  return jsonb_build_object(
    'success', true,
    'historial_id', v_historial_id,
    'productos_afectados', v_productos_count,
    'promedio_anterior', v_promedio_anterior,
    'promedio_nuevo', v_promedio_nuevo
  );
end;
$$ language plpgsql;

-- Función para obtener historial de cambios
create or replace function public.get_historial_precios(
  p_proveedor_id uuid default null,
  p_limite integer default 50
)
returns table(
  id uuid,
  proveedor_id uuid,
  proveedor_nombre text,
  porcentaje_cambio numeric,
  productos_afectados integer,
  valor_anterior_promedio numeric,
  valor_nuevo_promedio numeric,
  user_email text,
  created_at timestamptz
)
as $$
begin
  return query
  select
    h.id,
    h.proveedor_id,
    h.proveedor_nombre,
    h.porcentaje_cambio,
    h.productos_afectados,
    h.valor_anterior_promedio,
    h.valor_nuevo_promedio,
    h.user_email,
    h.created_at
  from
    historial_precios h
  where
    (p_proveedor_id is null or h.proveedor_id = p_proveedor_id)
  order by
    h.created_at desc
  limit p_limite;
end;
$$ language plpgsql stable;

-- Políticas RLS
alter table public.historial_precios enable row level security;

-- Política para lectura (usuarios autenticados pueden ver el historial)
create policy "Historial visible para usuarios autenticados"
  on public.historial_precios for select
  using (auth.role() = 'authenticated');

-- Política para inserción (solo mediante función)
create policy "Historial insertado mediante función"
  on public.historial_precios for insert
  with check (auth.role() = 'authenticated');

-- Comentarios
comment on table public.historial_precios is 'Registro de cambios de precios por proveedor';
comment on function public.actualizar_precios_proveedor_con_historial is 'Actualiza precios y registra el cambio en el historial';
comment on function public.get_historial_precios is 'Obtiene el historial de cambios de precios';
