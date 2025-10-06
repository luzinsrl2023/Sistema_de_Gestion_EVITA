-- Creamos la función para un login seguro que también migra contraseñas
-- Esta función se ejecuta con los privilegios del definidor (SECURITY DEFINER)
-- para poder actualizar la contraseña del usuario sin que RLS lo impida.

CREATE OR REPLACE FUNCTION login_and_migrate(email_input TEXT, password_input TEXT)
RETURNS TABLE (id UUID, email TEXT) AS $$
DECLARE
    user_record RECORD;
    is_password_valid BOOLEAN;
    new_password_hash TEXT;
BEGIN
    -- Asegurarnos de que la extensión pgcrypto esté disponible
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- Seleccionar el usuario por email
    SELECT * INTO user_record FROM public.usuarios_app WHERE usuarios_app.email = email_input;

    -- Si no se encuentra el usuario, no devolver nada
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Verificar si la contraseña almacenada es un hash de bcrypt
    IF user_record.password_hash LIKE '$2a$%' OR user_record.password_hash LIKE '$2b$%' THEN
        -- Es un hash, usar la extensión pgcrypto para comparar
        is_password_valid := (crypt(password_input, user_record.password_hash) = user_record.password_hash);
    ELSE
        -- Es texto plano
        is_password_valid := (user_record.password_hash = password_input);
    END IF;

    -- Si la contraseña es válida
    IF is_password_valid THEN
        -- Si era texto plano, hashearla y actualizarla
        IF NOT (user_record.password_hash LIKE '$2a$%' OR user_record.password_hash LIKE '$2b$%') THEN
            -- Generar el nuevo hash con bcrypt
            new_password_hash := crypt(password_input, gen_salt('bf', 10));
            -- Actualizar la tabla
            UPDATE public.usuarios_app SET password_hash = new_password_hash WHERE usuarios_app.id = user_record.id;
        END IF;

        -- Devolver los datos del usuario
        RETURN QUERY SELECT user_record.id, user_record.email;
    ELSE
        -- Si la contraseña no es válida, no devolver nada
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para que los roles anon y authenticated puedan ejecutar la función
GRANT EXECUTE ON FUNCTION login_and_migrate(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION login_and_migrate(TEXT, TEXT) TO authenticated;