-- =============================================
-- LIMPIEZA PREVIA (eliminar definiciones viejas)
-- =============================================
DROP TABLE IF EXISTS public.prospectos CASCADE;
DROP TYPE IF EXISTS prospecto_estado CASCADE;
DROP TYPE IF EXISTS estado_prospecto CASCADE;
DROP TYPE IF EXISTS prioridad_prospecto CASCADE;
DROP TYPE IF EXISTS fuente_prospecto CASCADE;

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE estado_prospecto AS ENUM (
    'Nuevo',
    'Contactado',
    'En_seguimiento',
    'Calificado',
    'Propuesta_enviada',
    'En_negociacion',
    'Convertido',
    'Perdido',
    'No_calificado'
);

CREATE TYPE prioridad_prospecto AS ENUM (
    'Baja',
    'Media',
    'Alta',
    'Urgente'
);

CREATE TYPE fuente_prospecto AS ENUM (
    'Sitio_web',
    'Redes_sociales',
    'Referido',
    'Email_marketing',
    'Evento',
    'Llamada_enfria',
    'Publicidad_pagada',
    'Otro'
);

-- =============================================
-- TABLA PRINCIPAL
-- =============================================
CREATE TABLE public.prospectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información básica
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(50),
    cargo VARCHAR(100),

    -- Empresa
    empresa VARCHAR(200),
    sitio_web VARCHAR(255),
    industria VARCHAR(100),
    tamaño_empresa VARCHAR(50),
    pais VARCHAR(100),
    ciudad VARCHAR(100),
    direccion TEXT,

    -- Prospecto
    estado estado_prospecto NOT NULL DEFAULT 'Nuevo',
    prioridad prioridad_prospecto NOT NULL DEFAULT 'Media',
    fuente fuente_prospecto,

    -- Presupuesto
    presupuesto_estimado DECIMAL(15,2),
    moneda_presupuesto VARCHAR(3) DEFAULT 'USD',

    -- Notas y descripción
    notas TEXT,
    descripcion_oportunidad TEXT,

    -- Fechas
    fecha_proximo_contacto TIMESTAMP WITH TIME ZONE,
    fecha_cierre_esperada DATE,

    -- Asignación
    responsable_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    -- Flexibilidad
    campos_adicionales JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE public.prospectos IS 'Almacena prospectos/leads con su ciclo de vida en CRM';
COMMENT ON COLUMN public.prospectos.responsable_id IS 'Usuario responsable del seguimiento';
COMMENT ON COLUMN public.prospectos.creado_por IS 'Usuario que creó el prospecto';

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_prospectos_estado
    ON public.prospectos(estado) WHERE deleted_at IS NULL;

CREATE INDEX idx_prospectos_responsable
    ON public.prospectos(responsable_id) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uniq_prospectos_email_activos
    ON public.prospectos(email) WHERE deleted_at IS NULL;

CREATE INDEX idx_prospectos_empresa
    ON public.prospectos(empresa) WHERE deleted_at IS NULL;

CREATE INDEX idx_prospectos_fecha_cierre
    ON public.prospectos(fecha_cierre_esperada) WHERE deleted_at IS NULL;

CREATE INDEX idx_prospectos_created_at
    ON public.prospectos(created_at DESC) WHERE deleted_at IS NULL;

-- =============================================
-- TRIGGER updated_at
-- =============================================
CREATE OR REPLACE FUNCTION actualizar_updated_at_prospectos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_prospectos
    BEFORE UPDATE ON public.prospectos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at_prospectos();

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS) PARA PROSPECTOS
-- =============================================

-- Habilitar RLS en la tabla
ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;

-- Política 1: Los usuarios pueden ver los prospectos que crearon, de los que son responsables, o si son administradores.
CREATE POLICY "Usuarios pueden ver sus prospectos o son admin"
ON public.prospectos FOR SELECT
USING (
    auth.uid() = responsable_id
    OR auth.uid() = creado_por
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Política 2: Los usuarios solo pueden crear prospectos asignados a sí mismos como creadores.
CREATE POLICY "Usuarios pueden crear prospectos"
ON public.prospectos FOR INSERT
WITH CHECK (
    auth.uid() = creado_por
);

-- Política 3: Los usuarios pueden actualizar/eliminar (soft delete) prospectos de los que son responsables, creadores o si son administradores.
CREATE POLICY "Usuarios pueden actualizar sus prospectos o son admin"
ON public.prospectos FOR UPDATE
USING (
    auth.uid() = responsable_id
    OR auth.uid() = creado_por
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    auth.uid() = responsable_id
    OR auth.uid() = creado_por
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- =============================================
-- VISTAS Y FUNCIONES AUXILIARES
-- =============================================

-- Vista para obtener solo prospectos activos (accesible para todos los roles, RLS se aplica)
CREATE OR REPLACE VIEW prospectos_activos AS
SELECT * FROM prospectos
WHERE deleted_at IS NULL;

-- Vista para que los usuarios vean solo sus prospectos asignados (RLS ya lo hace, pero es una conveniencia)
CREATE OR REPLACE VIEW mis_prospectos AS
SELECT * FROM prospectos
WHERE deleted_at IS NULL
AND (
    responsable_id = auth.uid()
    OR creado_por = auth.uid()
);

-- Función auxiliar para verificar permisos (útil en el lado del servidor si es necesario)
CREATE OR REPLACE FUNCTION tiene_permiso_prospecto(p_prospecto_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM prospectos
        WHERE id = p_prospecto_id
        AND deleted_at IS NULL
        AND (
            responsable_id = auth.uid()
            OR creado_por = auth.uid()
            OR EXISTS (
                SELECT 1 FROM auth.users
                WHERE id = auth.uid()
                AND raw_user_meta_data->>'role' = 'admin'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;