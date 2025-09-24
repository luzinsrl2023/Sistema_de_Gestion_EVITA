-- Configuración de Row Level Security para la tabla usuarios_app
-- Este script permite que los usuarios anónimos puedan leer la tabla usuarios_app
-- pero solo para propósitos de autenticación

-- Habilitar RLS en la tabla usuarios_app si no está habilitado
ALTER TABLE usuarios_app ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Permitir lectura de usuarios para autenticación" ON usuarios_app;

-- Crear política para permitir que usuarios anónimos lean la tabla usuarios_app
-- Esto es necesario para que el sistema de autenticación funcione
CREATE POLICY "Permitir lectura de usuarios para autenticación" ON usuarios_app
    FOR SELECT
    USING (true); -- Permite leer a cualquier usuario (incluyendo anónimos)

-- Opcional: Política para permitir que solo los usuarios autenticados se actualicen a sí mismos
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON usuarios_app;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON usuarios_app
    FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Política para permitir inserciones (registro de nuevos usuarios)
DROP POLICY IF EXISTS "Permitir registro de nuevos usuarios" ON usuarios_app;
CREATE POLICY "Permitir registro de nuevos usuarios" ON usuarios_app
    FOR INSERT
    WITH CHECK (true); -- Permite insertar nuevos usuarios

-- Verificar que las políticas fueron creadas
SELECT 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'usuarios_app';