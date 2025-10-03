-- Políticas RLS para permitir acceso a usuarios autenticados en tablas de prospectos
-- Ejecutar después de crear las tablas correspondientes

-- Política para tabla prospectos - permitir operaciones CRUD a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver prospectos" ON public.prospectos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar prospectos" ON public.prospectos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar prospectos" ON public.prospectos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar prospectos" ON public.prospectos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Política para tabla usuarios_app - permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver usuarios" ON public.usuarios_app
    FOR SELECT USING (auth.role() = 'authenticated');

-- Si existe la vista prospectos_with_users, aseguramos que tenga permisos
-- Nota: Las vistas heredan permisos de las tablas base, pero podemos crear políticas específicas si es necesario

-- Política adicional para permitir acceso administrativo a usuarios específicos
CREATE POLICY "Administradores pueden ver todos los usuarios" ON public.usuarios_app
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        auth.jwt() ->> 'email' IN ('claudiocaffre@evita.com', 'test@example.com')
    );

-- Política adicional para permitir acceso administrativo a prospectos
CREATE POLICY "Administradores pueden ver todos los prospectos" ON public.prospectos
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        auth.jwt() ->> 'email' IN ('claudiocaffre@evita.com', 'test@example.com')
    );

-- Para usuarios regulares, permitir acceso solo a sus propios prospectos o donde sean responsables
CREATE POLICY "Usuarios pueden ver sus prospectos asignados" ON public.prospectos
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            creado_por = auth.uid() OR
            responsable_id = auth.uid() OR
            auth.jwt() ->> 'email' IN ('claudiocaffre@evita.com', 'test@example.com')
        )
    );

CREATE POLICY "Usuarios pueden actualizar sus prospectos asignados" ON public.prospectos
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            creado_por = auth.uid() OR
            responsable_id = auth.uid() OR
            auth.jwt() ->> 'email' IN ('claudiocaffre@evita.com', 'test@example.com')
        )
    );

CREATE POLICY "Usuarios pueden insertar prospectos" ON public.prospectos
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Usuarios pueden eliminar sus prospectos asignados" ON public.prospectos
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            creado_por = auth.uid() OR
            responsable_id = auth.uid() OR
            auth.jwt() ->> 'email' IN ('claudiocaffre@evita.com', 'test@example.com')
        )
    );
