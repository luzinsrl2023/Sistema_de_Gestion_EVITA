-- 0) Asegurarse de la extensión necesaria para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Eliminar objetos previos que podrían causar conflictos
DROP FUNCTION IF EXISTS get_cotizaciones_stats();
DROP FUNCTION IF EXISTS update_cotizaciones_updated_at();
DROP TABLE IF EXISTS public.cotizaciones CASCADE;

-- 2) Crear la tabla
CREATE TABLE public.cotizaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  cliente_nombre text NOT NULL,
  cliente_email text,
  fecha date NOT NULL,
  validez_dias integer NOT NULL DEFAULT 15,
  notas text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  iva numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado text NOT NULL DEFAULT 'abierta',
  usuario_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cotizaciones_pkey PRIMARY KEY (id),
  CONSTRAINT cotizaciones_codigo_key UNIQUE (codigo),
  CONSTRAINT cotizaciones_estado_check CHECK (estado IN ('abierta','enviada','aceptada','rechazada','vencida')),
  CONSTRAINT cotizaciones_validez_dias_check CHECK (validez_dias > 0),
  CONSTRAINT cotizaciones_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT cotizaciones_iva_check CHECK (iva >= 0),
  CONSTRAINT cotizaciones_total_check CHECK (total >= 0)
);

-- 3) Índices
CREATE INDEX IF NOT EXISTS idx_cotizaciones_codigo ON public.cotizaciones (codigo);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON public.cotizaciones (fecha);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON public.cotizaciones (estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON public.cotizaciones (cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_usuario ON public.cotizaciones (usuario_id);

-- 4) Habilitar RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- 5) Políticas RLS (nota: auth.uid() funciona en Supabase; en Postgres puro falla)
CREATE POLICY "Users can view their own cotizaciones" ON public.cotizaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own cotizaciones" ON public.cotizaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own cotizaciones" ON public.cotizaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own cotizaciones" ON public.cotizaciones
  FOR DELETE USING (auth.uid() = usuario_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cotizaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7) Trigger
CREATE TRIGGER trigger_update_cotizaciones_updated_at
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_cotizaciones_updated_at();

-- 8) Función para estadísticas
-- Nota: si usas Supabase, auth.uid() devuelve uuid; si en tu instalación auth.uid() no existe, reemplaza la condición del WHERE por la que corresponda.
CREATE OR REPLACE FUNCTION get_cotizaciones_stats()
RETURNS TABLE (
  total_cotizaciones bigint,
  cotizaciones_mes bigint,
  valor_total_mes numeric,
  promedio_por_cotizacion numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_cotizaciones,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)) AS cotizaciones_mes,
    COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS valor_total_mes,
    COALESCE(AVG(total), 0) AS promedio_por_cotizacion
  FROM public.cotizaciones
  WHERE usuario_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
