-- Optimizaciones y mejoras basadas en la documentación actual de Supabase

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsqueda de texto eficiente
CREATE EXTENSION IF NOT EXISTS "unaccent";

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

-- Triggers para actualización de timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name, hospital_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'usuario'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (NEW.raw_user_meta_data->>'hospital_id')::UUID
  );

  -- Crear notificación de bienvenida
    INSERT INTO notifications (
        user_id,
        type,
        title,
    message
    ) VALUES (
    NEW.id,
    'welcome',
    'Bienvenido a FacilityManagerPro',
    'Gracias por registrarte. Tu cuenta ha sido creada exitosamente.'
  );

    RETURN NEW;
END;
$$;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para manejar verificación de email
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET status = 'active'
    WHERE id = NEW.id;

    INSERT INTO activity_logs (
        user_id,
        action,
        description,
        metadata
    ) VALUES (
        NEW.id,
      'email_verified',
      'Email verificado exitosamente',
      jsonb_build_object(
        'email', NEW.email,
        'verified_at', NEW.email_confirmed_at
      )
    );
  END IF;

    RETURN NEW;
END;
$$;

-- Trigger para verificación de email
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
    FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION handle_email_verification(); 