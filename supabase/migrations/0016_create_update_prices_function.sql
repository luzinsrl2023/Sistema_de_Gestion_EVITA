-- 0016_create_update_prices_function.sql
-- Crear función RPC para actualizar precios por proveedor con historial

-- Crear función para actualizar precios de productos por proveedor
CREATE OR REPLACE FUNCTION public.actualizar_precios_proveedor_con_historial(
  p_proveedor_id UUID,
  p_porcentaje NUMERIC,
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_productos_afectados INTEGER := 0;
  v_producto RECORD;
  v_nuevo_precio NUMERIC;
  v_old_price NUMERIC;
BEGIN
  -- Verificar que el proveedor existe
  IF NOT EXISTS (SELECT 1 FROM public.proveedores WHERE id = p_proveedor_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Proveedor no encontrado',
      'productos_afectados', 0
    );
  END IF;

  -- Verificar que el porcentaje es válido
  IF p_porcentaje <= 0 OR p_porcentaje > 1000 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Porcentaje debe estar entre 0 y 1000',
      'productos_afectados', 0
    );
  END IF;

  -- Iterar sobre todos los productos del proveedor
  FOR v_producto IN 
    SELECT id, precio, nombre 
    FROM public.productos 
    WHERE proveedor_id = p_proveedor_id
  LOOP
    -- Calcular nuevo precio
    v_old_price := v_producto.precio;
    v_nuevo_precio := v_producto.precio * (1 + (p_porcentaje / 100));
    
    -- Actualizar el precio del producto
    UPDATE public.productos 
    SET 
      precio = v_nuevo_precio,
      updated_at = NOW()
    WHERE id = v_producto.id;
    
    -- Insertar en historial de precios si existe la tabla
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historial_precios') THEN
      INSERT INTO public.historial_precios (
        producto_id,
        precio_anterior,
        precio_nuevo,
        porcentaje_cambio,
        motivo,
        usuario_id,
        usuario_email,
        created_at
      ) VALUES (
        v_producto.id,
        v_old_price,
        v_nuevo_precio,
        p_porcentaje,
        'Actualización masiva por proveedor',
        p_user_id,
        p_user_email,
        NOW()
      );
    END IF;
    
    v_productos_afectados := v_productos_afectados + 1;
  END LOOP;

  -- Retornar resultado exitoso
  RETURN json_build_object(
    'success', true,
    'error', NULL,
    'productos_afectados', v_productos_afectados,
    'proveedor_id', p_proveedor_id,
    'porcentaje_aplicado', p_porcentaje
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'productos_afectados', 0
    );
END;
$$;

-- Crear tabla historial_precios si no existe
CREATE TABLE IF NOT EXISTS public.historial_precios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    precio_anterior NUMERIC(12,2) NOT NULL,
    precio_nuevo NUMERIC(12,2) NOT NULL,
    porcentaje_cambio NUMERIC(5,2) NOT NULL,
    motivo TEXT,
    usuario_id UUID,
    usuario_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_historial_precios_producto ON public.historial_precios(producto_id);
CREATE INDEX IF NOT EXISTS idx_historial_precios_fecha ON public.historial_precios(created_at);

-- Habilitar RLS en la tabla historial_precios
ALTER TABLE public.historial_precios ENABLE ROW LEVEL SECURITY;

-- Crear políticas para historial_precios
CREATE POLICY "Permitir lectura de historial de precios" ON public.historial_precios
    FOR SELECT
    USING (true);

CREATE POLICY "Permitir inserción de historial de precios" ON public.historial_precios
    FOR INSERT
    WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON FUNCTION public.actualizar_precios_proveedor_con_historial IS 'Actualiza los precios de todos los productos de un proveedor aplicando un porcentaje de aumento y registra el historial';
COMMENT ON TABLE public.historial_precios IS 'Registra el historial de cambios de precios de productos';

