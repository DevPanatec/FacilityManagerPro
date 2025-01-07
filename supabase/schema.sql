-- Optimizaciones y mejoras basadas en la documentación actual de Supabase

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsqueda de texto eficiente
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Mejora de la tabla users con campos optimizados y búsqueda
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'enterprise', 'usuario')),
  first_name TEXT,
  last_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,  -- Para datos flexibles
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(unaccent(email), '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(unaccent(first_name), '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(unaccent(last_name), '')), 'B')
  ) STORED
);

-- Tabla de hospitales optimizada con búsqueda
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(unaccent(name), '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(unaccent(address), '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(unaccent(email), '')), 'C')
  ) STORED
);

-- Tabla de logs mejorada con particionamiento por fecha
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
) PARTITION BY RANGE (created_at);

-- Crear particiones por mes para los últimos 12 meses
DO $$
BEGIN
  FOR i IN 0..11 LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS activity_logs_%s PARTITION OF activity_logs 
       FOR VALUES FROM (%L) TO (%L)',
      to_char(CURRENT_DATE - (interval '1 month' * i), 'YYYY_MM'),
      date_trunc('month', CURRENT_DATE - (interval '1 month' * i)),
      date_trunc('month', CURRENT_DATE - (interval '1 month' * (i-1)))
    );
  END LOOP;
END $$;

-- Tabla de notificaciones optimizada
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_hospital_status ON users(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hospitals_name_trgm ON hospitals USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_fts ON users USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_hospitals_fts ON hospitals USING gin(fts);

-- Función para actualización de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Función mejorada para manejo de notificaciones
CREATE OR REPLACE FUNCTION handle_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _notification_id UUID;
    _notification_data JSONB;
    _user_data JSONB;
    _hospital_data JSONB;
BEGIN
    -- Get user data
    SELECT json_build_object(
        'id', id,
        'email', email,
        'role', role,
        'name', first_name || ' ' || last_name,
        'hospital_id', hospital_id
    )
    INTO _user_data
    FROM users
    WHERE id = NEW.user_id;

    -- Get hospital data if applicable
    IF (_user_data->>'hospital_id') IS NOT NULL THEN
        SELECT json_build_object(
            'id', id,
            'name', name,
            'email', email
        )
        INTO _hospital_data
        FROM hospitals
        WHERE id = (_user_data->>'hospital_id')::UUID;
    END IF;

    -- Build notification data
    _notification_id := gen_random_uuid();
    _notification_data := jsonb_build_object(
        'id', _notification_id,
        'type', TG_ARGV[0],
        'user_id', NEW.user_id,
        'title', TG_ARGV[1],
        'message', TG_ARGV[2],
        'user', _user_data,
        'hospital', _hospital_data,
        'metadata', CASE 
            WHEN TG_ARGV[3] IS NOT NULL THEN NEW.metadata
            ELSE '{}'::jsonb
        END,
        'created_at', now()
    );

    -- Insert notification
    INSERT INTO notifications (
        id,
        user_id,
        type,
        title,
        message,
        metadata,
        created_at
    ) VALUES (
        _notification_id,
        NEW.user_id,
        TG_ARGV[0],
        TG_ARGV[1],
        TG_ARGV[2],
        _notification_data,
        now()
    );

    -- Send realtime notification
    PERFORM pg_notify(
        'realtime',
        json_build_object(
            'type', 'notification',
            'event', TG_ARGV[0],
            'data', _notification_data
        )::text
    );

    -- Send email notification if configured
    IF TG_ARGV[4] = 'true' THEN
        PERFORM pg_notify(
            'email_notifications',
            json_build_object(
                'type', TG_ARGV[0],
                'recipient', _user_data->>'email',
                'template', TG_ARGV[0],
                'data', _notification_data
            )::text
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger para notificaciones de usuario
DROP TRIGGER IF EXISTS notify_user_changes ON users;
CREATE TRIGGER notify_user_changes
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification(
        CASE
            WHEN TG_OP = 'INSERT' THEN 'user_created'
            WHEN NEW.status != OLD.status THEN 'status_changed'
            WHEN NEW.role != OLD.role THEN 'role_changed'
            ELSE 'user_updated'
        END,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'Bienvenido'
            WHEN NEW.status != OLD.status THEN 'Estado Actualizado'
            WHEN NEW.role != OLD.role THEN 'Rol Actualizado'
            ELSE 'Perfil Actualizado'
        END,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'Tu cuenta ha sido creada exitosamente'
            WHEN NEW.status != OLD.status THEN 'Tu estado ha sido actualizado a ' || NEW.status
            WHEN NEW.role != OLD.role THEN 'Tu rol ha sido actualizado a ' || NEW.role
            ELSE 'Tu perfil ha sido actualizado'
        END,
        'true'  -- Include metadata
    );

-- Trigger para notificaciones de hospital
DROP TRIGGER IF EXISTS notify_hospital_changes ON hospitals;
CREATE TRIGGER notify_hospital_changes
    AFTER INSERT OR UPDATE ON hospitals
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification(
        CASE
            WHEN TG_OP = 'INSERT' THEN 'hospital_created'
            WHEN NEW.status != OLD.status THEN 'hospital_status_changed'
            ELSE 'hospital_updated'
        END,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'Nuevo Hospital'
            WHEN NEW.status != OLD.status THEN 'Estado de Hospital Actualizado'
            ELSE 'Hospital Actualizado'
        END,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'Se ha registrado un nuevo hospital: ' || NEW.name
            WHEN NEW.status != OLD.status THEN 'El estado del hospital ' || NEW.name || ' ha sido actualizado a ' || NEW.status
            ELSE 'La información del hospital ' || NEW.name || ' ha sido actualizada'
        END,
        'true'  -- Include metadata
    );

-- Función para limpieza automática de logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '12 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar limpieza automática (ejecutar manualmente en producción)
-- SELECT cron.schedule('0 0 1 * *', 'SELECT cleanup_old_logs();'); 

-- Función de búsqueda optimizada
CREATE OR REPLACE FUNCTION search_entities(
  query_text TEXT,
  entity_type TEXT,
  user_role TEXT DEFAULT NULL,
  hospital_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  description TEXT,
  metadata JSONB,
  rank REAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  query_tsquery tsquery;
BEGIN
  -- Normalizar y convertir la consulta
  query_tsquery := websearch_to_tsquery('spanish', unaccent(query_text));
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN entity_type = 'users' THEN u.id
      WHEN entity_type = 'hospitals' THEN h.id
    END AS id,
    entity_type AS type,
    CASE 
      WHEN entity_type = 'users' THEN u.first_name || ' ' || u.last_name
      WHEN entity_type = 'hospitals' THEN h.name
    END AS title,
    CASE 
      WHEN entity_type = 'users' THEN u.email
      WHEN entity_type = 'hospitals' THEN h.address
    END AS description,
    CASE 
      WHEN entity_type = 'users' THEN u.metadata
      WHEN entity_type = 'hospitals' THEN h.metadata
    END AS metadata,
    ts_rank(
      CASE 
        WHEN entity_type = 'users' THEN u.fts
        WHEN entity_type = 'hospitals' THEN h.fts
      END,
      query_tsquery
    ) AS rank
  FROM (
    SELECT unnest(ARRAY[entity_type]) AS type
  ) types
  LEFT JOIN users u ON entity_type = 'users'
    AND (
      user_role IS NULL 
      OR user_role = 'admin' 
      OR (user_role = 'enterprise' AND u.hospital_id = hospital_id)
    )
  LEFT JOIN hospitals h ON entity_type = 'hospitals'
    AND (
      user_role IS NULL 
      OR user_role = 'admin' 
      OR (user_role = 'enterprise' AND h.id = hospital_id)
    )
  WHERE 
    CASE 
      WHEN entity_type = 'users' THEN u.fts @@ query_tsquery
      WHEN entity_type = 'hospitals' THEN h.fts @@ query_tsquery
    END
  ORDER BY rank DESC;
END;
$$; 

-- Email handling function
CREATE OR REPLACE FUNCTION handle_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _template_data JSONB;
    _email_data JSONB;
BEGIN
    -- Get template data based on type
    _template_data := CASE TG_ARGV[0]
        WHEN 'welcome' THEN
            jsonb_build_object(
                'subject', 'Bienvenido a la plataforma',
                'template', 'welcome',
                'preheader', 'Gracias por registrarte'
            )
        WHEN 'password_reset' THEN
            jsonb_build_object(
                'subject', 'Restablecer contraseña',
                'template', 'password_reset',
                'preheader', 'Solicitud de restablecimiento de contraseña'
            )
        WHEN 'email_change' THEN
            jsonb_build_object(
                'subject', 'Confirmar cambio de email',
                'template', 'email_change',
                'preheader', 'Solicitud de cambio de email'
            )
        ELSE
            jsonb_build_object(
                'subject', TG_ARGV[1],
                'template', TG_ARGV[0],
                'preheader', TG_ARGV[2]
            )
    END;

    -- Build email data
    _email_data := jsonb_build_object(
        'id', gen_random_uuid(),
        'recipient', NEW.email,
        'recipient_name', COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.email),
        'template', _template_data->>'template',
        'subject', _template_data->>'subject',
        'preheader', _template_data->>'preheader',
        'data', jsonb_build_object(
            'user', json_build_object(
                'id', NEW.id,
                'email', NEW.email,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'role', NEW.role
            ),
            'metadata', NEW.metadata,
            'timestamp', extract(epoch from now())
        )
    );

    -- Log email request
    INSERT INTO activity_logs (
        user_id,
        action,
        description,
        metadata
    ) VALUES (
        NEW.id,
        'email_' || (_template_data->>'template'),
        'Email ' || (_template_data->>'subject') || ' enviado a ' || NEW.email,
        _email_data
    );

    -- Send email notification
    PERFORM pg_notify(
        'email_notifications',
        _email_data::text
    );

    RETURN NEW;
END;
$$;

-- Email triggers
DROP TRIGGER IF EXISTS send_welcome_email ON users;
CREATE TRIGGER send_welcome_email
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_email('welcome');

DROP TRIGGER IF EXISTS send_status_change_email ON users;
CREATE TRIGGER send_status_change_email
    AFTER UPDATE OF status ON users
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION handle_email(
        'status_change',
        'Estado de cuenta actualizado',
        'Tu estado ha sido actualizado'
    );

DROP TRIGGER IF EXISTS send_role_change_email ON users;
CREATE TRIGGER send_role_change_email
    AFTER UPDATE OF role ON users
    FOR EACH ROW
    WHEN (NEW.role IS DISTINCT FROM OLD.role)
    EXECUTE FUNCTION handle_email(
        'role_change',
        'Rol actualizado',
        'Tu rol ha sido actualizado'
    ); 

-- Funciones para reportes y métricas
CREATE OR REPLACE FUNCTION get_hospital_metrics(
    p_hospital_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value BIGINT,
    change_percentage NUMERIC
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH current_metrics AS (
        SELECT
            'total_users' as name,
            COUNT(DISTINCT u.id) as value
        FROM users u
        WHERE u.hospital_id = p_hospital_id
        AND u.created_at BETWEEN p_start_date AND p_end_date
        UNION ALL
        SELECT
            'active_users',
            COUNT(DISTINCT u.id)
        FROM users u
        WHERE u.hospital_id = p_hospital_id
        AND u.status = 'active'
        AND u.created_at BETWEEN p_start_date AND p_end_date
        UNION ALL
        SELECT
            'total_activities',
            COUNT(*)
        FROM activity_logs al
        JOIN users u ON u.id = al.user_id
        WHERE u.hospital_id = p_hospital_id
        AND al.created_at BETWEEN p_start_date AND p_end_date
    ),
    previous_metrics AS (
        SELECT
            'total_users' as name,
            COUNT(DISTINCT u.id) as value
        FROM users u
        WHERE u.hospital_id = p_hospital_id
        AND u.created_at BETWEEN
            p_start_date - (p_end_date - p_start_date)
            AND p_start_date
        UNION ALL
        SELECT
            'active_users',
            COUNT(DISTINCT u.id)
        FROM users u
        WHERE u.hospital_id = p_hospital_id
        AND u.status = 'active'
        AND u.created_at BETWEEN
            p_start_date - (p_end_date - p_start_date)
            AND p_start_date
        UNION ALL
        SELECT
            'total_activities',
            COUNT(*)
        FROM activity_logs al
        JOIN users u ON u.id = al.user_id
        WHERE u.hospital_id = p_hospital_id
        AND al.created_at BETWEEN
            p_start_date - (p_end_date - p_start_date)
            AND p_start_date
    )
    SELECT
        cm.name,
        cm.value,
        CASE
            WHEN pm.value = 0 THEN 100
            ELSE ROUND(((cm.value - pm.value)::NUMERIC / pm.value * 100), 2)
        END
    FROM current_metrics cm
    LEFT JOIN previous_metrics pm ON pm.name = cm.name;
END;
$$;

-- Función para actividad en tiempo real
CREATE OR REPLACE FUNCTION get_realtime_activity(
    p_hospital_id UUID,
    p_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
    timestamp TIMESTAMPTZ,
    action TEXT,
    count BIGINT,
    details JSONB
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        date_trunc('minute', al.created_at) as timestamp,
        al.action,
        COUNT(*) as count,
        jsonb_build_object(
            'users', array_agg(DISTINCT u.id),
            'metadata', jsonb_agg(al.metadata)
        ) as details
    FROM activity_logs al
    JOIN users u ON u.id = al.user_id
    WHERE u.hospital_id = p_hospital_id
    AND al.created_at >= NOW() - (p_minutes || ' minutes')::INTERVAL
    GROUP BY 1, 2
    ORDER BY 1 DESC, 2;
END;
$$;

-- Función para reporte detallado de hospital
CREATE OR REPLACE FUNCTION get_hospital_report(
    p_hospital_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    report_date DATE,
    total_users INTEGER,
    active_users INTEGER,
    new_users INTEGER,
    total_activities INTEGER,
    activity_breakdown JSONB
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH dates AS (
        SELECT generate_series(
            date_trunc('day', p_start_date),
            date_trunc('day', p_end_date),
            '1 day'::interval
        )::date as date
    ),
    user_stats AS (
        SELECT
            date_trunc('day', u.created_at)::date as stat_date,
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'active') as active_users,
            COUNT(DISTINCT u.id) FILTER (WHERE u.created_at::date = date_trunc('day', u.created_at)::date) as new_users
        FROM users u
        WHERE u.hospital_id = p_hospital_id
        AND u.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY 1
    ),
    activity_stats AS (
        SELECT
            date_trunc('day', al.created_at)::date as stat_date,
            COUNT(*) as total_activities,
            jsonb_object_agg(
                al.action,
                COUNT(*)
            ) as activity_breakdown
        FROM activity_logs al
        JOIN users u ON u.id = al.user_id
        WHERE u.hospital_id = p_hospital_id
        AND al.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY 1
    )
    SELECT
        d.date,
        COALESCE(us.total_users, 0),
        COALESCE(us.active_users, 0),
        COALESCE(us.new_users, 0),
        COALESCE(ast.total_activities, 0),
        COALESCE(ast.activity_breakdown, '{}'::jsonb)
    FROM dates d
    LEFT JOIN user_stats us ON us.stat_date = d.date
    LEFT JOIN activity_stats ast ON ast.stat_date = d.date
    ORDER BY d.date;
END;
$$;

-- Índices optimizados para reportes
CREATE INDEX IF NOT EXISTS idx_activity_logs_hospital_metrics
ON activity_logs (created_at)
INCLUDE (action, user_id)
WHERE user_id IN (
    SELECT id FROM users WHERE hospital_id IS NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_hospital_metrics
ON users (hospital_id, status, created_at)
INCLUDE (id, email);

-- Función para obtener estadísticas de uso
CREATE OR REPLACE FUNCTION get_usage_statistics(
    p_hospital_id UUID,
    p_period TEXT DEFAULT 'day'
)
RETURNS TABLE (
    period_start TIMESTAMPTZ,
    total_actions BIGINT,
    unique_users INTEGER,
    action_types JSONB
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        date_trunc(p_period, al.created_at) as period_start,
        COUNT(*) as total_actions,
        COUNT(DISTINCT al.user_id) as unique_users,
        jsonb_object_agg(
            al.action,
            COUNT(*)
        ) as action_types
    FROM activity_logs al
    JOIN users u ON u.id = al.user_id
    WHERE u.hospital_id = p_hospital_id
    GROUP BY 1
    ORDER BY 1 DESC;
END;
$$; 