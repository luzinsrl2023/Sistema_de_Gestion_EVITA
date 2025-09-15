-- 0000_initial_schema.sql
-- Esquema inicial para el ERP SaaS de Gestión

-- Habilitar RLS para todas las tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Roles
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);
COMMENT ON TABLE public.roles IS 'Almacena los roles de usuario (admin, compras, ventas, etc.).';

-- Tabla intermedia para la relación muchos a muchos entre usuarios y roles
CREATE TABLE public.user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
COMMENT ON TABLE public.user_roles IS 'Asigna roles a los usuarios.';

-- Tabla de Perfiles de Usuario (extiende auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT
);
COMMENT ON TABLE public.profiles IS 'Almacena datos adicionales del perfil de usuario.';

-- Tabla de Categorías de Productos
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Categorías para organizar los productos (limpieza, electricidad, etc.).';

-- Tabla de Productos
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    purchase_price NUMERIC(10, 2) DEFAULT 0.00,
    sale_price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.products IS 'Catálogo de productos y su stock.';

-- Tabla de Proveedores
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.suppliers IS 'Registro de proveedores de insumos.';

-- Tabla de Clientes
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.customers IS 'Registro de clientes del negocio.';

-- Tabla de Órdenes de Compra
CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    order_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, completada, cancelada
    total_amount NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.purchase_orders IS 'Órdenes de compra a proveedores.';

-- Tabla de Órdenes de Venta
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sale_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, pagada, vencida
    total_amount NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.sales IS 'Ventas realizadas a clientes.';

-- Tabla de Movimientos de Inventario (Kardex)
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    type TEXT NOT NULL, -- 'entrada' o 'salida'
    quantity INTEGER NOT NULL,
    movement_date TIMESTAMPTZ DEFAULT now(),
    related_purchase_id UUID REFERENCES public.purchase_orders(id),
    related_sale_id UUID REFERENCES public.sales(id)
);
COMMENT ON TABLE public.inventory_movements IS 'Kardex de entradas y salidas de productos.';

-- Tabla de Flujo de Caja
CREATE TABLE public.cash_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'ingreso' o 'egreso'
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    related_sale_id UUID REFERENCES public.sales(id),
    related_purchase_id UUID REFERENCES public.purchase_orders(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.cash_flow IS 'Registro de todos los ingresos y egresos de dinero.';

-- Tabla de Logs de Auditoría
CREATE TABLE public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.audit_logs IS 'Registra acciones importantes de los usuarios en el sistema.';

-- Insertar roles básicos
INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Administrador con acceso total'),
    ('compras', 'Usuario del módulo de compras'),
    ('ventas', 'Usuario del módulo de ventas'),
    ('contabilidad', 'Usuario del módulo de contabilidad'),
    ('auditor', 'Usuario con acceso de solo lectura a los registros');

-- Políticas de Seguridad (RLS) - EJEMPLOS BÁSICOS
-- Es crucial definir políticas más detalladas según la lógica de negocio.

-- Habilitar RLS en las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ... habilitar en todas las demás tablas

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Política: Los usuarios autenticados pueden leer los roles
CREATE POLICY "Authenticated users can read roles"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- Política: Los usuarios pueden ver sus propios roles
CREATE POLICY "Users can see their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios autenticados pueden ver los productos
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

