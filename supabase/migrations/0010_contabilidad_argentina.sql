-- =====================================================
-- Migration: Sistema de Contabilidad Argentina
-- =====================================================

-- Tabla: Plan de Cuentas (según normas argentinas)
create table if not exists public.plan_cuentas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  tipo text not null check (tipo in ('Activo', 'Pasivo', 'Patrimonio_Neto', 'Ingreso', 'Egreso')),
  subtipo text,
  nivel integer not null default 1,
  cuenta_padre_id uuid references public.plan_cuentas(id) on delete set null,
  imputable boolean default true,
  saldo_actual numeric(15,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla: Asientos Contables
create table if not exists public.asientos_contables (
  id uuid primary key default gen_random_uuid(),
  numero integer not null,
  fecha date not null,
  descripcion text not null,
  tipo text check (tipo in ('Apertura', 'Diario', 'Ajuste', 'Cierre')),
  estado text default 'Borrador' check (estado in ('Borrador', 'Confirmado', 'Anulado')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla: Movimientos (Debe y Haber)
create table if not exists public.movimientos_contables (
  id uuid primary key default gen_random_uuid(),
  asiento_id uuid references public.asientos_contables(id) on delete cascade,
  cuenta_id uuid references public.plan_cuentas(id) on delete restrict,
  debe numeric(15,2) default 0,
  haber numeric(15,2) default 0,
  descripcion text,
  created_at timestamptz default now()
);

-- Tabla: Libro Diario
create table if not exists public.libro_diario (
  id uuid primary key default gen_random_uuid(),
  asiento_id uuid references public.asientos_contables(id) on delete cascade,
  fecha date not null,
  numero_asiento integer not null,
  cuenta_codigo text not null,
  cuenta_nombre text not null,
  debe numeric(15,2) default 0,
  haber numeric(15,2) default 0,
  saldo numeric(15,2) default 0,
  created_at timestamptz default now()
);

-- Tabla: Libro Mayor
create table if not exists public.libro_mayor (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid references public.plan_cuentas(id) on delete cascade,
  fecha date not null,
  asiento_id uuid references public.asientos_contables(id) on delete cascade,
  descripcion text,
  debe numeric(15,2) default 0,
  haber numeric(15,2) default 0,
  saldo numeric(15,2) default 0,
  created_at timestamptz default now()
);

-- Tabla: Períodos Fiscales
create table if not exists public.periodos_fiscales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text default 'Abierto' check (estado in ('Abierto', 'Cerrado')),
  created_at timestamptz default now()
);

-- Índices
create index if not exists idx_plan_cuentas_codigo on plan_cuentas(codigo);
create index if not exists idx_plan_cuentas_tipo on plan_cuentas(tipo);
create index if not exists idx_asientos_fecha on asientos_contables(fecha desc);
create index if not exists idx_asientos_estado on asientos_contables(estado);
create index if not exists idx_movimientos_asiento on movimientos_contables(asiento_id);
create index if not exists idx_movimientos_cuenta on movimientos_contables(cuenta_id);
create index if not exists idx_libro_diario_fecha on libro_diario(fecha desc);
create index if not exists idx_libro_mayor_cuenta on libro_mayor(cuenta_id);
create index if not exists idx_libro_mayor_fecha on libro_mayor(fecha desc);

-- Plan de Cuentas Inicial (según normas argentinas)
insert into public.plan_cuentas (codigo, nombre, tipo, nivel, imputable) values
-- ACTIVO
('1', 'ACTIVO', 'Activo', 1, false),
('1.1', 'ACTIVO CORRIENTE', 'Activo', 2, false),
('1.1.1', 'Caja y Bancos', 'Activo', 3, false),
('1.1.1.01', 'Caja', 'Activo', 4, true),
('1.1.1.02', 'Banco Cuenta Corriente', 'Activo', 4, true),
('1.1.1.03', 'Mercado Pago', 'Activo', 4, true),
('1.1.2', 'Créditos por Ventas', 'Activo', 3, false),
('1.1.2.01', 'Deudores por Ventas', 'Activo', 4, true),
('1.1.2.02', 'Documentos a Cobrar', 'Activo', 4, true),
('1.1.3', 'Otros Créditos', 'Activo', 3, false),
('1.1.3.01', 'IVA Crédito Fiscal', 'Activo', 4, true),
('1.1.3.02', 'Anticipos a Proveedores', 'Activo', 4, true),
('1.1.4', 'Bienes de Cambio', 'Activo', 3, false),
('1.1.4.01', 'Mercaderías', 'Activo', 4, true),
('1.2', 'ACTIVO NO CORRIENTE', 'Activo', 2, false),
('1.2.1', 'Bienes de Uso', 'Activo', 3, false),
('1.2.1.01', 'Rodados', 'Activo', 4, true),
('1.2.1.02', 'Muebles y Útiles', 'Activo', 4, true),
('1.2.1.03', 'Equipos de Computación', 'Activo', 4, true),
('1.2.1.04', 'Amortización Acumulada', 'Activo', 4, true),

-- PASIVO
('2', 'PASIVO', 'Pasivo', 1, false),
('2.1', 'PASIVO CORRIENTE', 'Pasivo', 2, false),
('2.1.1', 'Deudas Comerciales', 'Pasivo', 3, false),
('2.1.1.01', 'Proveedores', 'Pasivo', 4, true),
('2.1.1.02', 'Documentos a Pagar', 'Pasivo', 4, true),
('2.1.2', 'Deudas Fiscales', 'Pasivo', 3, false),
('2.1.2.01', 'IVA Débito Fiscal', 'Pasivo', 4, true),
('2.1.2.02', 'Retenciones y Percepciones', 'Pasivo', 4, true),
('2.1.2.03', 'Cargas Sociales a Pagar', 'Pasivo', 4, true),
('2.1.3', 'Remuneraciones a Pagar', 'Pasivo', 3, false),
('2.1.3.01', 'Sueldos a Pagar', 'Pasivo', 4, true),
('2.2', 'PASIVO NO CORRIENTE', 'Pasivo', 2, false),
('2.2.1', 'Deudas Financieras', 'Pasivo', 3, false),
('2.2.1.01', 'Préstamos Bancarios', 'Pasivo', 4, true),

-- PATRIMONIO NETO
('3', 'PATRIMONIO NETO', 'Patrimonio_Neto', 1, false),
('3.1', 'Capital', 'Patrimonio_Neto', 2, false),
('3.1.1', 'Capital Social', 'Patrimonio_Neto', 3, true),
('3.2', 'Resultados', 'Patrimonio_Neto', 2, false),
('3.2.1', 'Resultado del Ejercicio', 'Patrimonio_Neto', 3, true),
('3.2.2', 'Resultados Acumulados', 'Patrimonio_Neto', 3, true),

-- INGRESOS
('4', 'INGRESOS', 'Ingreso', 1, false),
('4.1', 'Ingresos Operativos', 'Ingreso', 2, false),
('4.1.1', 'Ventas', 'Ingreso', 3, true),
('4.1.2', 'Descuentos Otorgados', 'Ingreso', 3, true),
('4.2', 'Otros Ingresos', 'Ingreso', 2, false),
('4.2.1', 'Intereses Ganados', 'Ingreso', 3, true),

-- EGRESOS
('5', 'EGRESOS', 'Egreso', 1, false),
('5.1', 'Costo de Ventas', 'Egreso', 2, false),
('5.1.1', 'Costo de Mercaderías Vendidas', 'Egreso', 3, true),
('5.2', 'Gastos de Administración', 'Egreso', 2, false),
('5.2.1', 'Sueldos y Jornales', 'Egreso', 3, true),
('5.2.2', 'Cargas Sociales', 'Egreso', 3, true),
('5.2.3', 'Alquileres', 'Egreso', 3, true),
('5.2.4', 'Servicios Públicos', 'Egreso', 3, true),
('5.2.5', 'Papelería y Útiles', 'Egreso', 3, true),
('5.3', 'Gastos de Comercialización', 'Egreso', 2, false),
('5.3.1', 'Comisiones', 'Egreso', 3, true),
('5.3.2', 'Publicidad', 'Egreso', 3, true),
('5.4', 'Gastos Financieros', 'Egreso', 2, false),
('5.4.1', 'Intereses Perdidos', 'Egreso', 3, true),
('5.4.2', 'Comisiones Bancarias', 'Egreso', 3, true)
on conflict (codigo) do nothing;

-- Función: Validar Balance de Asiento
create or replace function validar_balance_asiento(p_asiento_id uuid)
returns boolean as $$
declare
  v_total_debe numeric;
  v_total_haber numeric;
begin
  select 
    coalesce(sum(debe), 0),
    coalesce(sum(haber), 0)
  into v_total_debe, v_total_haber
  from movimientos_contables
  where asiento_id = p_asiento_id;
  
  return v_total_debe = v_total_haber;
end;
$$ language plpgsql;

-- Función: Confirmar Asiento
create or replace function confirmar_asiento(p_asiento_id uuid)
returns jsonb as $$
declare
  v_balanceado boolean;
  v_numero integer;
begin
  -- Verificar balance
  v_balanceado := validar_balance_asiento(p_asiento_id);
  
  if not v_balanceado then
    return jsonb_build_object(
      'success', false,
      'error', 'El asiento no está balanceado. Debe = Haber'
    );
  end if;
  
  -- Actualizar estado
  update asientos_contables
  set estado = 'Confirmado'
  where id = p_asiento_id;
  
  -- Actualizar saldos de cuentas
  update plan_cuentas pc
  set saldo_actual = saldo_actual + (
    select coalesce(sum(debe - haber), 0)
    from movimientos_contables
    where cuenta_id = pc.id and asiento_id = p_asiento_id
  )
  where id in (
    select cuenta_id from movimientos_contables where asiento_id = p_asiento_id
  );
  
  return jsonb_build_object(
    'success', true,
    'message', 'Asiento confirmado exitosamente'
  );
end;
$$ language plpgsql;

-- Función: Obtener Balance de Sumas y Saldos
create or replace function obtener_balance_sumas_saldos(
  p_fecha_desde date,
  p_fecha_hasta date
)
returns table(
  codigo text,
  nombre text,
  tipo text,
  debe numeric,
  haber numeric,
  saldo_deudor numeric,
  saldo_acreedor numeric
) as $$
begin
  return query
  select
    pc.codigo,
    pc.nombre,
    pc.tipo,
    coalesce(sum(mc.debe), 0) as debe,
    coalesce(sum(mc.haber), 0) as haber,
    case 
      when coalesce(sum(mc.debe - mc.haber), 0) > 0 
      then coalesce(sum(mc.debe - mc.haber), 0)
      else 0
    end as saldo_deudor,
    case 
      when coalesce(sum(mc.haber - mc.debe), 0) > 0 
      then coalesce(sum(mc.haber - mc.debe), 0)
      else 0
    end as saldo_acreedor
  from plan_cuentas pc
  left join movimientos_contables mc on pc.id = mc.cuenta_id
  left join asientos_contables ac on mc.asiento_id = ac.id
  where 
    pc.imputable = true
    and (ac.fecha between p_fecha_desde and p_fecha_hasta or ac.fecha is null)
    and (ac.estado = 'Confirmado' or ac.estado is null)
  group by pc.id, pc.codigo, pc.nombre, pc.tipo
  order by pc.codigo;
end;
$$ language plpgsql;

-- Políticas RLS
alter table public.plan_cuentas enable row level security;
alter table public.asientos_contables enable row level security;
alter table public.movimientos_contables enable row level security;
alter table public.libro_diario enable row level security;
alter table public.libro_mayor enable row level security;
alter table public.periodos_fiscales enable row level security;

create policy "Plan de cuentas visible para autenticados"
  on public.plan_cuentas for select
  using (auth.role() = 'authenticated');

create policy "Asientos visibles para autenticados"
  on public.asientos_contables for select
  using (auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden gestionar asientos"
  on public.asientos_contables for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Movimientos visibles para autenticados"
  on public.movimientos_contables for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Trigger para updated_at
create trigger set_updated_at_plan_cuentas
  before update on public.plan_cuentas
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_asientos
  before update on public.asientos_contables
  for each row
  execute function public.handle_updated_at();

-- Comentarios
comment on table public.plan_cuentas is 'Plan de cuentas según normas contables argentinas';
comment on table public.asientos_contables is 'Asientos contables del sistema';
comment on table public.movimientos_contables is 'Movimientos de debe y haber';
comment on function validar_balance_asiento is 'Valida que un asiento esté balanceado';
comment on function confirmar_asiento is 'Confirma un asiento y actualiza saldos';
comment on function obtener_balance_sumas_saldos is 'Genera balance de sumas y saldos';
