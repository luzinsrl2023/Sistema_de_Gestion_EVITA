-- Crear tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id text NOT NULL,
  proveedor_id uuid NOT NULL,
  fecha date NOT NULL,
  vencimiento date NOT NULL,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente',
  usuario_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id),
  CONSTRAINT ordenes_compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores (id) ON DELETE CASCADE,
  CONSTRAINT ordenes_compra_estado_check CHECK (estado IN ('pendiente', 'confirmada', 'recibida', 'cancelada'))
);

-- Crear tabla de items de órdenes
CREATE TABLE IF NOT EXISTS public.orden_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  orden_id text NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio numeric(12, 2) NOT NULL DEFAULT 0,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orden_items_pkey PRIMARY KEY (id),
  CONSTRAINT orden_items_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes_compra (id) ON DELETE CASCADE,
  CONSTRAINT orden_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos (id) ON DELETE CASCADE,
  CONSTRAINT orden_items_cantidad_check CHECK (cantidad > 0),
  CONSTRAINT orden_items_precio_check CHECK (precio >= 0)
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON public.ordenes_compra (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_fecha ON public.ordenes_compra (fecha);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON public.ordenes_compra (estado);
CREATE INDEX IF NOT EXISTS idx_orden_items_orden ON public.orden_items (orden_id);
CREATE INDEX IF NOT EXISTS idx_orden_items_producto ON public.orden_items (producto_id);

-- Habilitar RLS
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ordenes_compra
CREATE POLICY "Users can view their own orders" ON public.ordenes_compra
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own orders" ON public.ordenes_compra
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own orders" ON public.ordenes_compra
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own orders" ON public.ordenes_compra
  FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas RLS para orden_items
CREATE POLICY "Users can view items of their orders" ON public.orden_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra 
      WHERE id = orden_items.orden_id 
      AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their orders" ON public.orden_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra 
      WHERE id = orden_items.orden_id 
      AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of their orders" ON public.orden_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra 
      WHERE id = orden_items.orden_id 
      AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items of their orders" ON public.orden_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_compra 
      WHERE id = orden_items.orden_id 
      AND usuario_id = auth.uid()
    )
  );

-- Función para actualizar subtotal automáticamente
CREATE OR REPLACE FUNCTION update_orden_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = NEW.cantidad * NEW.precio;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar subtotal
CREATE TRIGGER trigger_update_orden_item_subtotal
  BEFORE INSERT OR UPDATE ON public.orden_items
  FOR EACH ROW
  EXECUTE FUNCTION update_orden_item_subtotal();

-- Función para actualizar total de la orden
CREATE OR REPLACE FUNCTION update_orden_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ordenes_compra 
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM public.orden_items 
    WHERE orden_id = COALESCE(NEW.orden_id, OLD.orden_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.orden_id, OLD.orden_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar total de la orden
CREATE TRIGGER trigger_update_orden_total
  AFTER INSERT OR UPDATE OR DELETE ON public.orden_items
  FOR EACH ROW
  EXECUTE FUNCTION update_orden_total();
