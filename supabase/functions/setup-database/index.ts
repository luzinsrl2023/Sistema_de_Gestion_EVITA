import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // SQL para crear todas las tablas necesarias
    const setupSQL = `
      -- Extensiones necesarias
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      -- Tabla usuarios_app (ya existe, pero asegurémonos)
      CREATE TABLE IF NOT EXISTS public.usuarios_app (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          nombre TEXT,
          rol TEXT DEFAULT 'usuario',
          activo BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla clientes
      CREATE TABLE IF NOT EXISTS public.clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        email TEXT UNIQUE,
        telefono TEXT,
        direccion TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla proveedores
      CREATE TABLE IF NOT EXISTS public.proveedores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        email TEXT,
        telefono TEXT,
        direccion TEXT,
        margen NUMERIC(5,2) DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla productos
      CREATE TABLE IF NOT EXISTS public.productos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio NUMERIC(12,2) NOT NULL,
        precio_compra NUMERIC(12,2) DEFAULT 0.00,
        stock INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 0,
        categoria TEXT,
        proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla ventas
      CREATE TABLE IF NOT EXISTS public.ventas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        total NUMERIC(12,2) NOT NULL DEFAULT 0,
        estado TEXT CHECK (estado IN ('pendiente','pagada','cancelada')) DEFAULT 'pendiente',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla venta_detalle
      CREATE TABLE IF NOT EXISTS public.venta_detalle (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
        producto_id UUID REFERENCES public.productos(id) ON DELETE RESTRICT,
        cantidad INTEGER NOT NULL,
        precio_unitario NUMERIC(12,2) NOT NULL,
        subtotal NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla cotizaciones
      CREATE TABLE IF NOT EXISTS public.cotizaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
        fecha DATE DEFAULT CURRENT_DATE,
        total NUMERIC(12,2),
        estado TEXT CHECK (estado IN ('abierta','aprobada','rechazada')) DEFAULT 'abierta',
        venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla cotizacion_detalle
      CREATE TABLE IF NOT EXISTS public.cotizacion_detalle (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
        producto_id UUID REFERENCES public.productos(id) ON DELETE RESTRICT,
        cantidad INTEGER NOT NULL,
        precio_unitario NUMERIC(12,2) NOT NULL,
        subtotal NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla facturas
      CREATE TABLE IF NOT EXISTS public.facturas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
        numero_factura TEXT UNIQUE NOT NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        monto NUMERIC(12,2) NOT NULL,
        estado TEXT CHECK (estado IN ('emitida','pagada','vencida')) DEFAULT 'emitida',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla ordenes (compras)
      CREATE TABLE IF NOT EXISTS public.ordenes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
        fecha DATE DEFAULT CURRENT_DATE,
        estado TEXT CHECK (estado IN ('pendiente','recibida','cancelada')) DEFAULT 'pendiente',
        total NUMERIC(12,2),
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla orden_detalle
      CREATE TABLE IF NOT EXISTS public.orden_detalle (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        orden_id UUID REFERENCES public.ordenes(id) ON DELETE CASCADE,
        producto_id UUID REFERENCES public.productos(id) ON DELETE RESTRICT,
        cantidad INTEGER NOT NULL,
        precio_unitario NUMERIC(12,2) NOT NULL,
        subtotal NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla cobranzas
      CREATE TABLE IF NOT EXISTS public.cobranzas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
        factura_id UUID REFERENCES public.facturas(id) ON DELETE CASCADE,
        fecha DATE DEFAULT CURRENT_DATE,
        monto NUMERIC(12,2) NOT NULL,
        metodo_pago TEXT CHECK (metodo_pago IN ('efectivo','transferencia','tarjeta')) DEFAULT 'efectivo',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Tabla historial_precios
      CREATE TABLE IF NOT EXISTS public.historial_precios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE,
        precio_anterior NUMERIC(12,2),
        precio_nuevo NUMERIC(12,2) NOT NULL,
        fecha_cambio TIMESTAMPTZ DEFAULT now(),
        motivo TEXT,
        usuario_id UUID REFERENCES public.usuarios_app(id) ON DELETE SET NULL
      );

      -- Tabla prospectos
      CREATE TABLE IF NOT EXISTS public.prospectos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        email TEXT,
        telefono TEXT,
        empresa TEXT,
        interes TEXT,
        estado TEXT CHECK (estado IN ('nuevo','contactado','calificado','propuesta','cerrado')) DEFAULT 'nuevo',
        notas TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Crear índices para mejor rendimiento
      CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
      CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON public.productos(proveedor_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON public.ventas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha);
      CREATE INDEX IF NOT EXISTS idx_facturas_venta ON public.facturas(venta_id);
      CREATE INDEX IF NOT EXISTS idx_ordenes_proveedor ON public.ordenes(proveedor_id);
      CREATE INDEX IF NOT EXISTS idx_cobranzas_cliente ON public.cobranzas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_cobranzas_factura ON public.cobranzas(factura_id);
      CREATE INDEX IF NOT EXISTS idx_usuarios_app_email ON public.usuarios_app(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_app_activo ON public.usuarios_app(activo);

      -- Habilitar RLS en todas las tablas
      ALTER TABLE public.usuarios_app ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.venta_detalle ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.cotizacion_detalle ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.orden_detalle ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.cobranzas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.historial_precios ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;

      -- Políticas de seguridad básicas (permitir todo para desarrollo)
      -- En producción, estas políticas deben ser más restrictivas
      
      -- Políticas para usuarios_app
      DROP POLICY IF EXISTS "Permitir lectura de usuarios para autenticación" ON public.usuarios_app;
      CREATE POLICY "Permitir lectura de usuarios para autenticación" ON public.usuarios_app
          FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Permitir registro de nuevos usuarios" ON public.usuarios_app;
      CREATE POLICY "Permitir registro de nuevos usuarios" ON public.usuarios_app
          FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.usuarios_app;
      CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.usuarios_app
          FOR UPDATE USING (true);

      -- Políticas para todas las demás tablas (permitir todo por ahora)
      DO $$
      DECLARE
          table_name TEXT;
          tables TEXT[] := ARRAY['clientes', 'proveedores', 'productos', 'ventas', 'venta_detalle', 
                                'cotizaciones', 'cotizacion_detalle', 'facturas', 'ordenes', 
                                'orden_detalle', 'cobranzas', 'historial_precios', 'prospectos'];
      BEGIN
          FOREACH table_name IN ARRAY tables
          LOOP
              -- Política de SELECT
              EXECUTE format('DROP POLICY IF EXISTS "Permitir lectura %s" ON public.%I', table_name, table_name);
              EXECUTE format('CREATE POLICY "Permitir lectura %s" ON public.%I FOR SELECT USING (true)', table_name, table_name);
              
              -- Política de INSERT
              EXECUTE format('DROP POLICY IF EXISTS "Permitir inserción %s" ON public.%I', table_name, table_name);
              EXECUTE format('CREATE POLICY "Permitir inserción %s" ON public.%I FOR INSERT WITH CHECK (true)', table_name, table_name);
              
              -- Política de UPDATE
              EXECUTE format('DROP POLICY IF EXISTS "Permitir actualización %s" ON public.%I', table_name, table_name);
              EXECUTE format('CREATE POLICY "Permitir actualización %s" ON public.%I FOR UPDATE USING (true)', table_name, table_name);
              
              -- Política de DELETE
              EXECUTE format('DROP POLICY IF EXISTS "Permitir eliminación %s" ON public.%I', table_name, table_name);
              EXECUTE format('CREATE POLICY "Permitir eliminación %s" ON public.%I FOR DELETE USING (true)', table_name, table_name);
          END LOOP;
      END $$;

      -- Insertar usuario demo si no existe
      INSERT INTO public.usuarios_app (email, password_hash, nombre, rol, activo) 
      VALUES ('test@example.com', 'password123', 'Usuario Demo', 'admin', true)
      ON CONFLICT (email) DO NOTHING;

      -- Insertar datos de ejemplo
      INSERT INTO public.clientes (nombre, email, telefono, direccion) VALUES
      ('Cliente Demo', 'cliente@demo.com', '123456789', 'Dirección Demo')
      ON CONFLICT (email) DO NOTHING;

      INSERT INTO public.proveedores (nombre, email, telefono, direccion, margen) VALUES
      ('Proveedor Demo', 'proveedor@demo.com', '987654321', 'Dirección Proveedor', 15.00)
      ON CONFLICT DO NOTHING;

      INSERT INTO public.productos (nombre, descripcion, precio, precio_compra, stock, categoria) VALUES
      ('Producto Demo', 'Descripción del producto demo', 100.00, 80.00, 50, 'Limpieza')
      ON CONFLICT DO NOTHING;
    `;

    // Ejecutar el SQL de configuración
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupSQL });

    if (error) {
      console.error('Error setting up database:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Error al configurar la base de datos'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Base de datos configurada exitosamente',
      tables: [
        'usuarios_app', 'clientes', 'proveedores', 'productos', 
        'ventas', 'venta_detalle', 'cotizaciones', 'cotizacion_detalle',
        'facturas', 'ordenes', 'orden_detalle', 'cobranzas',
        'historial_precios', 'prospectos'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error('Setup database error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message,
      details: 'Error inesperado durante la configuración'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
