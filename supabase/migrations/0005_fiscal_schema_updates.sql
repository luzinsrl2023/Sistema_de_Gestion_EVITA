-- 0005_fiscal_schema_updates.sql
-- Adaptación del esquema para futura integración fiscal (AFIP) y configuración de empresa.

-- 1) Modificar la tabla 'facturas' para añadir campos fiscales.
alter table public.facturas
  add column if not exists tipo_comprobante text, -- ej. 'A', 'B', 'C', 'Remito'
  add column if not exists cae text, -- Se llenará con la integración de AFIP
  add column if not exists cae_vencimiento date, -- Fecha de vencimiento del CAE
  add column if not exists desglose_impuestos jsonb; -- Para almacenar IVA, percepciones, etc.

-- Comentario sobre los nuevos campos para futura referencia.
comment on column public.facturas.tipo_comprobante is 'Tipo de comprobante fiscal según normativa de AFIP (Factura A, B, C, etc.).';
comment on column public.facturas.cae is 'Código de Autorización Electrónico. Se obtendrá del webservice de AFIP.';
comment on column public.facturas.cae_vencimiento is 'Fecha de vencimiento del CAE obtenido de AFIP.';
comment on column public.facturas.desglose_impuestos is 'Objeto JSON para almacenar el detalle de impuestos aplicados (ej. {"iva_21": 1050.50, "percepcion_iibb": 150.25}).';

-- 2) Crear tabla 'empresa_configuracion' para almacenar datos de la empresa de forma segura.
create table if not exists public.empresa_configuracion (
  id uuid primary key default gen_random_uuid(), -- Clave primaria única
  nombre text,
  cuit text,
  direccion text,
  telefono text,
  email text,
  website text,
  logo_url text, -- URL pública del logo en Supabase Storage
  logo_path text, -- Path del logo para poder eliminarlo
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentario sobre la nueva tabla.
comment on table public.empresa_configuracion is 'Almacena la configuración y datos fiscales de la empresa que usa el sistema. Se espera que contenga una sola fila activa por empresa.';

-- 3) Habilitar Row Level Security (RLS) en la nueva tabla y definir políticas.
-- Esto asegura que solo los usuarios autenticados puedan acceder a la configuración.
alter table public.empresa_configuracion enable row level security;

create policy "Los usuarios autenticados pueden ver la configuración"
  on public.empresa_configuracion for select
  to authenticated
  using (true);

create policy "Los administradores pueden insertar y actualizar la configuración"
  on public.empresa_configuracion for all
  to authenticated -- En un caso real, esto debería restringirse a un rol 'admin'.
  using (true)
  with check (true);

-- Nota: Para un sistema multi-tenant real, se añadiría una columna 'empresa_id'
-- y las políticas de RLS se basarían en ese ID para aislar los datos de cada cliente.
-- Por simplicidad, este esquema asume una única empresa.