-- =====================================================
-- Migration: Fix Cotizaciones RLS Policies for App Auth
-- =====================================================

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Users can view their own cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Users can insert their own cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Users can update their own cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Users can delete their own cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Public read cotizaciones (app-auth)" ON public.cotizaciones;
DROP POLICY IF EXISTS "Public insert cotizaciones (app-auth)" ON public.cotizaciones;
DROP POLICY IF EXISTS "Public update cotizaciones (app-auth)" ON public.cotizaciones;
DROP POLICY IF EXISTS "Public delete cotizaciones (app-auth)" ON public.cotizaciones;

-- Políticas RLS para cotizaciones
-- Permite leer e insertar incluso cuando no hay sesión de Supabase (anon role)
CREATE POLICY "Public read cotizaciones (app-auth)" ON public.cotizaciones
  FOR SELECT TO anon USING (true);

CREATE POLICY "Public insert cotizaciones (app-auth)" ON public.cotizaciones
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public update cotizaciones (app-auth)" ON public.cotizaciones
  FOR UPDATE TO anon USING (true);

CREATE POLICY "Public delete cotizaciones (app-auth)" ON public.cotizaciones
  FOR DELETE TO anon USING (true);

-- Políticas para usuarios autenticados de Supabase
CREATE POLICY "Users can view their own cotizaciones" ON public.cotizaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own cotizaciones" ON public.cotizaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own cotizaciones" ON public.cotizaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own cotizaciones" ON public.cotizaciones
  FOR DELETE USING (auth.uid() = usuario_id);

-- Función para obtener estadísticas de cotizaciones
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
    COUNT(*) as total_cotizaciones,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)) as cotizaciones_mes,
    COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)), 0) as valor_total_mes,
    COALESCE(AVG(total), 0) as promedio_por_cotizacion
  FROM public.cotizaciones;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;