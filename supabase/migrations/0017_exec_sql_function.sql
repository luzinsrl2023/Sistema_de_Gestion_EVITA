-- Función para ejecutar SQL dinámicamente (solo para configuración inicial)
-- Esta función debe ser eliminada después de la configuración inicial por seguridad

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TEXT AS $$
BEGIN
    EXECUTE sql;
    RETURN 'SQL executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos solo al service role
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;
