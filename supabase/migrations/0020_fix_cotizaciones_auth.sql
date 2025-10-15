-- =====================================================
-- Migration: Fix Cotizaciones Authentication Issues
-- =====================================================

-- Fix the get_cotizaciones_stats function to work without auth.uid()
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
  FROM public.cotizaciones;
  -- Removed WHERE usuario_id = auth.uid() to work with app-auth system
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add additional RLS policies to support app-auth
-- Allow anonymous users to perform CRUD operations (for app-auth system)
CREATE POLICY "Allow app-auth read" ON public.cotizaciones
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow app-auth insert" ON public.cotizaciones
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow app-auth update" ON public.cotizaciones
  FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow app-auth delete" ON public.cotizaciones
  FOR DELETE TO anon USING (true);