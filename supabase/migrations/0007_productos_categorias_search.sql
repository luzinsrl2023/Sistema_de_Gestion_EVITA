-- =====================================================
-- Migration: Categorías, SKU, Margen y Búsqueda Avanzada
-- =====================================================

-- 1) Crear tabla categorias
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Agregar columna categoria_id a productos
alter table public.productos
add column if not exists categoria_id uuid references public.categorias(id) on delete set null;

-- 3) Agregar columna sku a productos
alter table public.productos
add column if not exists sku text unique;

-- 4) Agregar columna margen (% de ganancia)
alter table public.productos
add column if not exists margen numeric(5,2) default 0 check (margen >= 0);

-- 5) Agregar columna precio_final
alter table public.productos
add column if not exists precio_final numeric(12,2);

-- 6) Insertar categorías iniciales
insert into public.categorias (nombre, descripcion) values
  ('Limpieza', 'Productos de limpieza y desinfección'),
  ('Electricidad', 'Productos eléctricos y accesorios'),
  ('Higiene', 'Productos de cuidado personal'),
  ('Ferretería', 'Herramientas y materiales de construcción'),
  ('Oficina', 'Artículos de oficina y papelería'),
  ('Alimentos', 'Productos alimenticios'),
  ('Bebidas', 'Bebidas y refrescos'),
  ('Otros', 'Productos varios')
on conflict (nombre) do nothing;

-- 7) Actualizar productos con categorías según nombre (si categoria es null)
update public.productos
set categoria_id = (select id from public.categorias where nombre = 'Limpieza')
where categoria_id is null and (
  nombre ilike '%Limpiador%' or 
  nombre ilike '%Detergente%' or 
  nombre ilike '%Desinfectante%' or
  nombre ilike '%Lavandina%' or
  nombre ilike '%Cloro%'
);

update public.productos
set categoria_id = (select id from public.categorias where nombre = 'Electricidad')
where categoria_id is null and (
  nombre ilike '%Cable%' or 
  nombre ilike '%Bombilla%' or 
  nombre ilike '%Enchufe%' or
  nombre ilike '%Lámpara%' or
  nombre ilike '%Foco%'
);

update public.productos
set categoria_id = (select id from public.categorias where nombre = 'Higiene')
where categoria_id is null and (
  nombre ilike '%Jabón%' or
  nombre ilike '%Shampoo%' or
  nombre ilike '%Pasta%dental%' or
  nombre ilike '%Papel%higiénico%'
);

update public.productos
set categoria_id = (select id from public.categorias where nombre = 'Ferretería')
where categoria_id is null and (
  nombre ilike '%Tornillo%' or
  nombre ilike '%Clavo%' or
  nombre ilike '%Martillo%' or
  nombre ilike '%Destornillador%'
);

-- 8) Función para actualizar precios aplicando margen de cada producto
create or replace function public.actualizar_precios_por_proveedor(p_proveedor_id uuid)
returns void as $$
begin
  update public.productos
  set 
    precio_final = round(precio_compra * (1 + margen / 100), 2),
    updated_at = now()
  where proveedor_id = p_proveedor_id;
end;
$$ language plpgsql;

-- 9) Función alternativa: aplicar un margen dinámico desde el botón
create or replace function public.actualizar_precios_con_margen(p_proveedor_id uuid, p_margen numeric)
returns void as $$
begin
  update public.productos
  set 
    precio_final = round(precio_compra * (1 + p_margen / 100), 2),
    updated_at = now()
  where proveedor_id = p_proveedor_id;
end;
$$ language plpgsql;

-- =====================================================
-- Búsqueda Avanzada con Trigramas
-- =====================================================

-- 10) Activa la extensión para búsqueda por trigramas (búsqueda "fuzzy")
create extension if not exists pg_trgm;

-- 11) Índices para que la búsqueda en texto sea ultra-rápida
create index if not exists idx_productos_nombre_trgm
  on productos using gin (nombre gin_trgm_ops);

create index if not exists idx_productos_sku_trgm
  on productos using gin (sku gin_trgm_ops);

create index if not exists idx_productos_descripcion_trgm
  on productos using gin (descripcion gin_trgm_ops);

create index if not exists idx_categorias_nombre_trgm
  on categorias using gin (nombre gin_trgm_ops);

-- 12) Índice en categoria_id para joins rápidos
create index if not exists idx_productos_categoria_id
  on productos(categoria_id);

-- =====================================================
-- Función de Búsqueda de Productos
-- =====================================================

-- 13) Función de búsqueda de productos mejorada
create or replace function public.buscar_productos(
  busqueda text,
  limite integer default 20,
  desplazamiento integer default 0
)
returns table(
  id uuid,
  name text,
  sku text,
  price numeric,
  description text,
  category_name text,
  stock integer,
  supplier_id uuid,
  supplier_name text
)
as $$
begin
  return query
  select
    p.id,
    p.nombre as name,
    p.sku,
    coalesce(p.precio_final, p.precio, 0) as price,
    p.descripcion as description,
    c.nombre as category_name,
    coalesce(p.stock, 0) as stock,
    p.proveedor_id as supplier_id,
    prov.nombre as supplier_name
  from
    productos as p
    left join categorias as c on p.categoria_id = c.id
    left join proveedores as prov on p.proveedor_id = prov.id
  where
    busqueda is not null and busqueda != '' and (
      p.nombre ilike ('%' || busqueda || '%') or
      p.sku ilike ('%' || busqueda || '%') or
      p.descripcion ilike ('%' || busqueda || '%') or
      c.nombre ilike ('%' || busqueda || '%')
    )
  order by
    -- Priorizar coincidencias exactas en nombre
    case when p.nombre ilike busqueda then 1
         when p.sku ilike busqueda then 2
         when p.nombre ilike (busqueda || '%') then 3
         else 4
    end,
    p.nombre
  limit limite
  offset desplazamiento;
end;
$$ language plpgsql stable;

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================

-- 14) Habilitar RLS en categorias
alter table public.categorias enable row level security;

-- 15) Política para lectura pública de categorías
create policy "Categorías son visibles para todos"
  on public.categorias for select
  using (true);

-- 16) Política para inserción/actualización de categorías (solo usuarios autenticados)
create policy "Usuarios autenticados pueden gestionar categorías"
  on public.categorias for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- Triggers para updated_at
-- =====================================================

-- 17) Función genérica para actualizar updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 18) Trigger para categorias
drop trigger if exists set_updated_at_categorias on public.categorias;
create trigger set_updated_at_categorias
  before update on public.categorias
  for each row
  execute function public.handle_updated_at();

-- =====================================================
-- Comentarios para documentación
-- =====================================================

comment on table public.categorias is 'Categorías de productos para clasificación y filtrado';
comment on column public.productos.categoria_id is 'Referencia a la categoría del producto';
comment on column public.productos.sku is 'Código único de identificación del producto (Stock Keeping Unit)';
comment on column public.productos.margen is 'Porcentaje de margen de ganancia sobre el precio de compra';
comment on column public.productos.precio_final is 'Precio final calculado con margen aplicado';
comment on function public.buscar_productos is 'Búsqueda avanzada de productos por nombre, SKU, descripción o categoría';
