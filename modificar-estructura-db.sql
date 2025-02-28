-- =================================================================
-- SCRIPT PARA MODIFICAR LA ESTRUCTURA DE LA BASE DE DATOS
-- ELIMINA LA RESTRICCIÓN DE CLAVE FORÁNEA Y AÑADE TRIGGERS
-- =================================================================
-- ADVERTENCIA: Este script realiza cambios estructurales en la base de datos.
-- Se recomienda hacer una copia de seguridad antes de ejecutarlo.
-- =================================================================

-- Parte 1: Crear un respaldo de los datos clave
CREATE TABLE IF NOT EXISTS public.users_backup AS 
SELECT * FROM public.users;

CREATE TABLE IF NOT EXISTS auth.users_backup AS 
SELECT * FROM auth.users;

-- Parte 2: Identificar y eliminar la restricción de clave foránea
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Buscar el nombre exacto de la restricción de clave foránea
    -- Versión corregida que funciona con diferentes versiones de PostgreSQL
    SELECT conname INTO constraint_name
    FROM pg_constraint pc
    JOIN pg_class pc1 ON pc1.oid = pc.conrelid
    JOIN pg_class pc2 ON pc2.oid = pc.confrelid
    JOIN pg_namespace pn1 ON pn1.oid = pc1.relnamespace
    JOIN pg_namespace pn2 ON pn2.oid = pc2.relnamespace
    WHERE pc1.relname = 'users'
    AND pc2.relname = 'users'
    AND pn1.nspname = 'public'
    AND pn2.nspname = 'auth'
    AND pc.contype = 'f';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Restricción % eliminada con éxito', constraint_name;
    ELSE
        RAISE NOTICE 'No se encontró la restricción de clave foránea esperada';
    END IF;
END
$$;

-- Verificar que la función no existe antes de crearla para evitar errores
DROP FUNCTION IF EXISTS public.list_user_dependencies();

-- Listar todas las tablas que dependen de public.users
CREATE OR REPLACE FUNCTION public.list_user_dependencies()
RETURNS TABLE (
    referencing_table text,
    referencing_column text,
    constraint_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.table_schema || '.' || tc.table_name as referencing_table,
        kcu.column_name as referencing_column,
        tc.constraint_name
    FROM 
        information_schema.table_constraints tc
    JOIN 
        information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN 
        information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE 
        tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'public'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id';
END;
$$ LANGUAGE plpgsql;

-- Verificar que la función se creó correctamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'list_user_dependencies'
    ) THEN
        RAISE EXCEPTION 'La función public.list_user_dependencies() no se creó correctamente';
    ELSE
        RAISE NOTICE 'La función public.list_user_dependencies() se creó correctamente';
    END IF;
END
$$;

-- Parte 3: Crear funciones y triggers para mantener la sincronización

-- 3.1: Función para sincronizar de public.users a auth.users
CREATE OR REPLACE FUNCTION sync_public_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es una inserción y el usuario no existe en auth.users
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND 
       NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
        
        -- Crear un registro básico en auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            raw_app_meta_data,
            aud,
            role
        ) VALUES (
            NEW.id,
            '00000000-0000-0000-0000-000000000000',
            NEW.email,
            -- Contraseña temporal, se deberá cambiar después
            crypt('ChangeMe123!', gen_salt('bf')),
            NOW(),
            NEW.created_at,
            NEW.updated_at,
            jsonb_build_object(
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'email_verified', true,
                'verified', true
            ),
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email']::text[],
                'role', NEW.role
            ),
            'authenticated',
            'authenticated'
        );
        RAISE NOTICE 'Usuario creado en auth.users con ID %', NEW.id;
    
    -- Si es una actualización y el usuario existe en auth.users
    ELSIF TG_OP = 'UPDATE' AND 
          EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
        
        -- Actualizar los metadatos en auth.users
        UPDATE auth.users SET
            email = NEW.email,
            updated_at = NOW(),
            raw_user_meta_data = jsonb_build_object(
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'email_verified', true,
                'verified', true
            ) || (raw_user_meta_data - 'first_name' - 'last_name'),
            raw_app_meta_data = jsonb_set(
                raw_app_meta_data,
                '{role}',
                to_jsonb(NEW.role)
            )
        WHERE id = NEW.id;
        RAISE NOTICE 'Usuario actualizado en auth.users con ID %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2: Trigger para sincronizar inserciones y actualizaciones de public.users a auth.users
DROP TRIGGER IF EXISTS users_to_auth_trigger ON public.users;
CREATE TRIGGER users_to_auth_trigger
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION sync_public_to_auth();

-- 3.3: Función mejorada para manejar eliminaciones, considerando tablas dependientes
CREATE OR REPLACE FUNCTION sync_public_delete_to_auth()
RETURNS TRIGGER AS $$
DECLARE
    dependency_record RECORD;
    has_dependencies BOOLEAN := FALSE;
    dependency_list TEXT := '';
    count_refs INTEGER;
BEGIN
    -- Verificar si hay registros en tablas dependientes que usan este ID de usuario
    FOR dependency_record IN (
        SELECT * FROM public.list_user_dependencies()
    ) LOOP
        -- Consulta dinámica para contar referencias
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %s WHERE %I = $1', 
                        dependency_record.referencing_table,
                        dependency_record.referencing_column) 
            INTO count_refs
            USING OLD.id;
            
            IF count_refs > 0 THEN
                has_dependencies := TRUE;
                dependency_list := dependency_list || dependency_record.referencing_table || '.' || 
                                dependency_record.referencing_column || ' (' || 
                                count_refs || ' registros), ';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error al verificar tabla %: %', 
                dependency_record.referencing_table, SQLERRM;
        END;
    END LOOP;

    -- Si hay dependencias, registrar pero permitir la eliminación
    -- ya que es decisión del desarrollador cómo manejar esto
    IF has_dependencies THEN
        RAISE WARNING 'El usuario con ID % tiene dependencias en: %', 
            OLD.id, 
            SUBSTRING(dependency_list, 1, LENGTH(dependency_list) - 2);
    END IF;
    
    -- Eliminar el usuario correspondiente en auth.users
    DELETE FROM auth.users WHERE id = OLD.id;
    RAISE NOTICE 'Usuario eliminado de auth.users con ID %', OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4: Trigger para sincronizar eliminaciones de public.users a auth.users
DROP TRIGGER IF EXISTS users_delete_to_auth_trigger ON public.users;
CREATE TRIGGER users_delete_to_auth_trigger
AFTER DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION sync_public_delete_to_auth();

-- 3.5: Función para sincronizar cambios en auth.users a public.users
CREATE OR REPLACE FUNCTION sync_auth_to_public()
RETURNS TRIGGER AS $$
DECLARE
    v_first_name text;
    v_last_name text;
BEGIN
    -- Extraer first_name y last_name de los metadatos
    v_first_name := NEW.raw_user_meta_data->>'first_name';
    v_last_name := NEW.raw_user_meta_data->>'last_name';
    
    -- Si es una inserción y el usuario no existe en public.users
    IF (TG_OP = 'INSERT') AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        -- Crear un registro básico en public.users
        INSERT INTO public.users (
            id,
            email,
            first_name,
            last_name,
            role,
            created_at,
            updated_at,
            status
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(v_first_name, 'Usuario'),
            COALESCE(v_last_name, 'Nuevo'),
            COALESCE(NEW.raw_app_meta_data->>'role', 'user'),
            NEW.created_at,
            NEW.updated_at,
            'active'
        );
        RAISE NOTICE 'Usuario creado en public.users con ID %', NEW.id;
    
    -- Si es una actualización y el usuario existe en public.users
    ELSIF TG_OP = 'UPDATE' AND EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        -- Actualizar los datos en public.users
        UPDATE public.users SET
            email = NEW.email,
            first_name = COALESCE(v_first_name, first_name),
            last_name = COALESCE(v_last_name, last_name),
            role = COALESCE(NEW.raw_app_meta_data->>'role', role),
            updated_at = NOW()
        WHERE id = NEW.id;
        RAISE NOTICE 'Usuario actualizado en public.users con ID %', NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error al sincronizar auth.users a public.users: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6: Trigger para sincronizar cambios de auth.users a public.users
-- Nota: Este trigger podría requerir permisos especiales para ser creado
DO $$
BEGIN
    BEGIN
        DROP TRIGGER IF EXISTS auth_to_users_trigger ON auth.users;
        CREATE TRIGGER auth_to_users_trigger
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION sync_auth_to_public();
        
        RAISE NOTICE 'Trigger de sincronización creado en auth.users';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'No se pudo crear el trigger en auth.users debido a permisos insuficientes';
            RAISE NOTICE 'Esta parte requerirá permisos de superusuario o un rol con permisos específicos';
    END;
END$$;

-- 3.7: Función para manejar la eliminación en auth.users y actualizar public.users
CREATE OR REPLACE FUNCTION sync_auth_delete_to_public()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si existe en public.users y eliminarlo si es así
    IF EXISTS (SELECT 1 FROM public.users WHERE id = OLD.id) THEN
        -- La eliminación en public.users activará el trigger que verifica dependencias
        DELETE FROM public.users WHERE id = OLD.id;
        RAISE NOTICE 'Usuario eliminado de public.users con ID %', OLD.id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.8: Trigger para sincronizar eliminaciones de auth.users a public.users
DO $$
BEGIN
    BEGIN
        DROP TRIGGER IF EXISTS auth_delete_to_users_trigger ON auth.users;
        CREATE TRIGGER auth_delete_to_users_trigger
        AFTER DELETE ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION sync_auth_delete_to_public();
        
        RAISE NOTICE 'Trigger de eliminación creado en auth.users';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'No se pudo crear el trigger de eliminación en auth.users debido a permisos insuficientes';
    END;
END$$;

-- Parte 4: Crear funciones auxiliares para las vistas

-- Crear función para obtener el conteo de dependencias de un usuario
CREATE OR REPLACE FUNCTION public.get_user_dependency_count(user_id uuid, table_name text, column_name text)
RETURNS integer AS $$
DECLARE
    count_refs INTEGER;
BEGIN
    BEGIN
        -- Consulta dinámica para contar referencias
        EXECUTE format('SELECT COUNT(*) FROM %s WHERE %I = $1', 
                      table_name,
                      column_name) 
        INTO count_refs
        USING user_id;
        
        RETURN count_refs;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error al verificar tabla %: %', table_name, SQLERRM;
        RETURN 0;
    END;
END;
$$ LANGUAGE plpgsql;

-- Crear vistas para facilitar consultas conjuntas
CREATE OR REPLACE VIEW public.users_full_view AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.organization_id,
    u.status,
    u.created_at,
    u.updated_at,
    a.email_confirmed_at,
    a.last_sign_in_at,
    a.raw_user_meta_data,
    a.raw_app_meta_data
FROM 
    public.users u
LEFT JOIN 
    auth.users a ON u.id = a.id;

-- Asegurar que la función list_user_dependencies existe antes de crear la vista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'list_user_dependencies'
    ) THEN
        RAISE EXCEPTION 'La función public.list_user_dependencies() no existe. No se puede crear la vista user_dependency_view';
    END IF;
END
$$;

-- Ahora crear la vista de dependencias
CREATE OR REPLACE VIEW public.user_dependency_view AS
SELECT 
    u.id AS user_id,
    u.email,
    u.role,
    u.status,
    d.referencing_table,
    d.referencing_column,
    public.get_user_dependency_count(u.id, d.referencing_table, d.referencing_column) AS references_count
FROM 
    public.users u
CROSS JOIN 
    public.list_user_dependencies() d;

-- Parte 5: Función para verificar integridad entre tablas
CREATE OR REPLACE FUNCTION public.verify_users_integrity()
RETURNS TABLE (
    user_id uuid,
    email text,
    in_public_users boolean,
    in_auth_users boolean,
    has_dependencies boolean,
    dependency_count int,
    status text
) AS $$
DECLARE
    u_rec RECORD;
    dependency_record RECORD;
    dep_count INTEGER;
BEGIN
    -- Recuperar todos los usuarios de ambas tablas
    FOR u_rec IN (
        SELECT DISTINCT id 
        FROM (
            SELECT id FROM public.users
            UNION
            SELECT id FROM auth.users
        ) AS combined_users
    ) LOOP
        -- Verificar presencia en cada tabla
        in_public_users := EXISTS (SELECT 1 FROM public.users WHERE id = u_rec.id);
        in_auth_users := EXISTS (SELECT 1 FROM auth.users WHERE id = u_rec.id);
        
        -- Contar dependencias
        dep_count := 0;
        
        -- Solo verificar dependencias si el usuario existe en public.users
        IF in_public_users THEN
            -- Bucle para cada posible dependencia
            FOR dependency_record IN (
                SELECT * FROM public.list_user_dependencies()
            ) LOOP
                -- Sumar dependencias encontradas
                dep_count := dep_count + public.get_user_dependency_count(
                    u_rec.id, 
                    dependency_record.referencing_table, 
                    dependency_record.referencing_column
                );
            END LOOP;
        END IF;
        
        has_dependencies := dep_count > 0;
        dependency_count := dep_count;
        
        -- Determinar estado del usuario
        IF in_public_users AND in_auth_users THEN
            status := 'Sincronizado';
        ELSIF in_public_users AND NOT in_auth_users THEN
            status := 'Falta en auth.users';
        ELSIF NOT in_public_users AND in_auth_users THEN
            status := 'Falta en public.users';
        ELSE
            status := 'Desconocido';
        END IF;
        
        -- Obtener email
        IF in_public_users THEN
            SELECT email INTO email FROM public.users WHERE id = u_rec.id;
        ELSIF in_auth_users THEN
            SELECT email INTO email FROM auth.users WHERE id = u_rec.id;
        ELSE
            email := NULL;
        END IF;
        
        user_id := u_rec.id;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Función para reparar automáticamente inconsistencias
CREATE OR REPLACE FUNCTION public.repair_users_integrity()
RETURNS TABLE (
    user_id uuid,
    action text,
    success boolean
) AS $$
DECLARE
    integrity_rec RECORD;
    repair_success BOOLEAN;
    action_taken TEXT;
BEGIN
    -- Iterar sobre cada registro con problemas
    FOR integrity_rec IN (
        SELECT * FROM public.verify_users_integrity() 
        WHERE status != 'Sincronizado'
    ) LOOP
        repair_success := FALSE;
        
        -- Caso 1: Usuario existe en auth.users pero no en public.users
        IF integrity_rec.in_auth_users AND NOT integrity_rec.in_public_users THEN
            BEGIN
                INSERT INTO public.users (
                    id, 
                    email, 
                    first_name, 
                    last_name,
                    role,
                    created_at,
                    updated_at,
                    status
                )
                SELECT 
                    id, 
                    email, 
                    COALESCE(raw_user_meta_data->>'first_name', 'Usuario'),
                    COALESCE(raw_user_meta_data->>'last_name', 'Restaurado'),
                    COALESCE(raw_app_meta_data->>'role', 'user'),
                    created_at,
                    updated_at,
                    'active'
                FROM auth.users
                WHERE id = integrity_rec.user_id;
                
                action_taken := 'Creado en public.users';
                repair_success := TRUE;
            EXCEPTION WHEN OTHERS THEN
                action_taken := 'Error al crear en public.users: ' || SQLERRM;
                repair_success := FALSE;
            END;
        
        -- Caso 2: Usuario existe en public.users pero no en auth.users
        ELSIF integrity_rec.in_public_users AND NOT integrity_rec.in_auth_users THEN
            BEGIN
                -- Este caso se manejará automáticamente por el trigger sync_public_to_auth
                -- Actualizamos el registro para activar el trigger
                UPDATE public.users
                SET updated_at = NOW()
                WHERE id = integrity_rec.user_id;
                
                action_taken := 'Actualizado para activar sincronización con auth.users';
                repair_success := TRUE;
            EXCEPTION WHEN OTHERS THEN
                action_taken := 'Error al actualizar para sincronización: ' || SQLERRM;
                repair_success := FALSE;
            END;
        END IF;
        
        -- Devolver resultados de la reparación
        user_id := integrity_rec.user_id;
        action := action_taken;
        success := repair_success;
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Parte 6: Función adicional para crear usuarios completos
CREATE OR REPLACE FUNCTION public.create_complete_user(
    p_email text,
    p_password text,
    p_first_name text,
    p_last_name text,
    p_role text,
    p_organization_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := gen_random_uuid();
BEGIN
    -- Insertar directamente en public.users
    -- El trigger se encargará de sincronizar con auth.users
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        role,
        organization_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        p_email,
        p_first_name,
        p_last_name,
        p_role,
        p_organization_id,
        'active',
        NOW(),
        NOW()
    );
    
    -- Actualizar la contraseña en auth.users
    UPDATE auth.users SET
        encrypted_password = crypt(p_password, gen_salt('bf'))
    WHERE id = v_user_id;
    
    RETURN v_user_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error al crear usuario: %', SQLERRM;
END;
$$;

-- Parte 7: Función segura para eliminar usuarios verificando dependencias
CREATE OR REPLACE FUNCTION public.safe_delete_user(
    p_user_id uuid,
    p_force boolean DEFAULT false
)
RETURNS TABLE (
    success boolean,
    message text,
    dependencies text[]
)
AS $$
DECLARE
    dependency_record RECORD;
    dependencies_found text[] := ARRAY[]::text[];
    has_dependencies boolean := false;
    count_refs INTEGER;
BEGIN
    -- Verificar dependencias
    FOR dependency_record IN (
        SELECT * FROM public.list_user_dependencies()
    ) LOOP
        -- Usar la función auxiliar para contar referencias
        count_refs := public.get_user_dependency_count(
            p_user_id, 
            dependency_record.referencing_table, 
            dependency_record.referencing_column
        );
        
        IF count_refs > 0 THEN
            has_dependencies := TRUE;
            dependencies_found := array_append(
                dependencies_found, 
                dependency_record.referencing_table || '.' || 
                dependency_record.referencing_column || ' (' || 
                count_refs || ' registros)'
            );
        END IF;
    END LOOP;
    
    -- Si hay dependencias y no se fuerza la eliminación, retornar error
    IF has_dependencies AND NOT p_force THEN
        RETURN QUERY SELECT 
            false AS success, 
            'El usuario tiene dependencias que impiden su eliminación segura' AS message,
            dependencies_found;
        RETURN;
    END IF;
    
    -- Eliminar el usuario
    BEGIN
        DELETE FROM public.users WHERE id = p_user_id;
        
        RETURN QUERY SELECT 
            true AS success, 
            'Usuario eliminado con éxito' || 
            CASE WHEN has_dependencies AND p_force 
                THEN ' (con ' || array_length(dependencies_found, 1) || ' dependencias forzadas)'
                ELSE ''
            END AS message,
            dependencies_found;
        RETURN;
    EXCEPTION WHEN others THEN
        RETURN QUERY SELECT 
            false AS success, 
            'Error al eliminar usuario: ' || SQLERRM AS message,
            dependencies_found;
        RETURN;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Parte 8: Función para generar informes de dependencias de usuario
CREATE OR REPLACE FUNCTION public.generate_user_dependencies_report()
RETURNS TABLE (
    email text,
    role text,
    status text,
    dependency_tables int,
    total_dependencies int,
    related_tables text[]
)
AS $$
DECLARE
    u_rec RECORD;
    d_rec RECORD;
    table_count INTEGER := 0;
    dep_total INTEGER := 0;
    tables_list text[] := ARRAY[]::text[];
    count_refs INTEGER;
BEGIN
    -- Para cada usuario
    FOR u_rec IN (SELECT id, email, role, status FROM public.users) LOOP
        table_count := 0;
        dep_total := 0;
        tables_list := ARRAY[]::text[];
        
        -- Para cada posible dependencia
        FOR d_rec IN (SELECT * FROM public.list_user_dependencies()) LOOP
            -- Usar la función auxiliar para contar referencias
            count_refs := public.get_user_dependency_count(
                u_rec.id, 
                d_rec.referencing_table, 
                d_rec.referencing_column
            );
            
            IF count_refs > 0 THEN
                table_count := table_count + 1;
                dep_total := dep_total + count_refs;
                
                -- Solo agregar la tabla si no está ya en la lista
                IF NOT d_rec.referencing_table = ANY(tables_list) THEN
                    tables_list := array_append(tables_list, d_rec.referencing_table);
                END IF;
            END IF;
        END LOOP;
        
        -- Solo devolver usuarios con dependencias
        IF dep_total > 0 THEN
            email := u_rec.email;
            role := u_rec.role;
            status := u_rec.status;
            dependency_tables := table_count;
            total_dependencies := dep_total;
            related_tables := tables_list;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Parte 9: Probar la solución
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Crear un usuario de prueba
    test_user_id := public.create_complete_user(
        'test.structural.change@example.com',
        'TestPassword123!',
        'Test',
        'Structural',
        'user',
        NULL
    );
    
    -- Verificar que existe en ambas tablas
    RAISE NOTICE 'Verificando usuario en public.users:';
    PERFORM * FROM public.users WHERE id = test_user_id;
    IF FOUND THEN
        RAISE NOTICE 'Usuario encontrado en public.users';
    ELSE
        RAISE NOTICE 'Usuario NO encontrado en public.users';
    END IF;
    
    RAISE NOTICE 'Verificando usuario en auth.users:';
    PERFORM * FROM auth.users WHERE id = test_user_id;
    IF FOUND THEN
        RAISE NOTICE 'Usuario encontrado en auth.users';
    ELSE
        RAISE NOTICE 'Usuario NO encontrado en auth.users';
    END IF;
    
    -- Verificar integridad
    RAISE NOTICE 'Ejecutando verificación de integridad:';
    PERFORM * FROM public.verify_users_integrity()
    WHERE user_id = test_user_id;
    
    -- Probar eliminación segura
    RAISE NOTICE 'Probando eliminación segura:';
    SELECT * FROM public.safe_delete_user(test_user_id);
    
    -- Verificar eliminación en ambas tablas
    PERFORM * FROM public.users WHERE id = test_user_id;
    IF NOT FOUND THEN
        RAISE NOTICE 'Usuario eliminado correctamente de public.users';
    END IF;
    
    PERFORM * FROM auth.users WHERE id = test_user_id;
    IF NOT FOUND THEN
        RAISE NOTICE 'Usuario eliminado correctamente de auth.users';
    END IF;
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error en la prueba: %', SQLERRM;
END;
$$;

-- Parte 10: Documentación y mensajes finales
COMMENT ON FUNCTION sync_public_to_auth IS 'Sincroniza cambios de public.users a auth.users';
COMMENT ON FUNCTION sync_public_delete_to_auth IS 'Sincroniza eliminaciones de public.users a auth.users, verificando dependencias';
COMMENT ON FUNCTION sync_auth_to_public IS 'Sincroniza cambios de auth.users a public.users';
COMMENT ON FUNCTION sync_auth_delete_to_public IS 'Sincroniza eliminaciones de auth.users a public.users';
COMMENT ON FUNCTION public.create_complete_user IS 'Crea un usuario completo en ambas tablas simultáneamente';
COMMENT ON FUNCTION public.list_user_dependencies IS 'Lista todas las tablas y columnas que dependen de public.users';
COMMENT ON FUNCTION public.verify_users_integrity IS 'Verifica la integridad entre auth.users y public.users';
COMMENT ON FUNCTION public.repair_users_integrity IS 'Repara automáticamente inconsistencias entre auth.users y public.users';
COMMENT ON FUNCTION public.safe_delete_user IS 'Elimina usuarios de forma segura, verificando dependencias';
COMMENT ON FUNCTION public.generate_user_dependencies_report IS 'Genera un informe de dependencias para todos los usuarios';
COMMENT ON VIEW public.users_full_view IS 'Vista que combina datos de usuarios de ambas tablas';
COMMENT ON VIEW public.user_dependency_view IS 'Vista que muestra las dependencias de cada usuario';

-- Mostrar mensajes finales
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'CAMBIOS EN LA ESTRUCTURA DE LA BASE DE DATOS COMPLETADOS';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Se han realizado los siguientes cambios:';
    RAISE NOTICE '1. Se ha eliminado la restricción de clave foránea';
    RAISE NOTICE '2. Se han creado triggers para sincronización automática';
    RAISE NOTICE '3. Se han añadido funciones avanzadas para manejar dependencias';
    RAISE NOTICE '4. Se han creado vistas para consultar usuarios y sus dependencias';
    RAISE NOTICE '5. Se han implementado mecanismos de verificación y reparación';
    RAISE NOTICE '';
    RAISE NOTICE 'FUNCIONES IMPORTANTES:';
    RAISE NOTICE '- Para crear usuarios: SELECT public.create_complete_user(...);';
    RAISE NOTICE '- Para verificar integridad: SELECT * FROM public.verify_users_integrity();';
    RAISE NOTICE '- Para reparar inconsistencias: SELECT * FROM public.repair_users_integrity();';
    RAISE NOTICE '- Para eliminar con seguridad: SELECT * FROM public.safe_delete_user(user_id, force);';
    RAISE NOTICE '- Para ver dependencias: SELECT * FROM public.user_dependency_view;';
    RAISE NOTICE '- Para generar informe: SELECT * FROM public.generate_user_dependencies_report();';
    RAISE NOTICE '';
    RAISE NOTICE 'VISTAS ÚTILES:';
    RAISE NOTICE '- Para datos completos: SELECT * FROM public.users_full_view;';
    RAISE NOTICE '- Para ver dependencias: SELECT * FROM public.user_dependency_view;';
    RAISE NOTICE '============================================================';
END;
$$; 