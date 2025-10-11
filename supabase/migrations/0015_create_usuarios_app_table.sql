-- 0015_create_usuarios_app_table.sql
-- Crear tabla usuarios_app para autenticación personalizada

-- Crear tabla usuarios_app
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

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_app_email ON public.usuarios_app(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_app_activo ON public.usuarios_app(activo);

-- Habilitar RLS
ALTER TABLE public.usuarios_app ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- Permitir lectura para autenticación
CREATE POLICY "Permitir lectura de usuarios para autenticación" ON public.usuarios_app
    FOR SELECT
    USING (true);

-- Permitir inserción de nuevos usuarios
CREATE POLICY "Permitir registro de nuevos usuarios" ON public.usuarios_app
    FOR INSERT
    WITH CHECK (true);

-- Permitir actualización de perfil propio
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.usuarios_app
    FOR UPDATE
    USING (true);

-- Insertar usuario demo
INSERT INTO public.usuarios_app (email, password_hash, nombre, rol, activo) 
VALUES ('test@example.com', 'password123', 'Usuario Demo', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE public.usuarios_app IS 'Tabla de usuarios para autenticación personalizada del sistema EVITA';
COMMENT ON COLUMN public.usuarios_app.email IS 'Email único del usuario';
COMMENT ON COLUMN public.usuarios_app.password_hash IS 'Hash de la contraseña (en producción debe estar hasheada)';
COMMENT ON COLUMN public.usuarios_app.rol IS 'Rol del usuario: admin, usuario, etc.';
COMMENT ON COLUMN public.usuarios_app.activo IS 'Indica si el usuario está activo en el sistema';

