-- Create auth triggers and functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  raw_user_meta_data JSONB;
  first_name TEXT;
  last_name TEXT;
  organization_id UUID;
BEGIN
  -- Extract user metadata
  raw_user_meta_data := NEW.raw_user_meta_data;
  first_name := raw_user_meta_data->>'first_name';
  last_name := raw_user_meta_data->>'last_name';
  organization_id := (raw_user_meta_data->>'organization_id')::UUID;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    organization_id,
    role,
    status,
    avatar_url,
    last_sign_in_at
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name,
    last_name,
    organization_id,
    COALESCE(raw_user_meta_data->>'role', 'usuario'),
    'pending',
    raw_user_meta_data->>'avatar_url',
    NEW.last_sign_in_at
  );

  -- Log activity
  INSERT INTO public.activity_logs (
    user_id,
    organization_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    NEW.id,
    organization_id,
    'user.created',
    'profiles',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    )
  );

  RETURN NEW;
END;
$$;

-- Create email verification handler
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update profile status
  UPDATE public.profiles
  SET status = 'active'
  WHERE id = NEW.id
  AND NEW.email_confirmed_at IS NOT NULL
  AND status = 'pending';

  -- Log activity if email was verified
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    INSERT INTO public.activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.id,
      'user.verified',
      'profiles',
      NEW.id,
      jsonb_build_object('email', NEW.email)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create last sign in handler
CREATE OR REPLACE FUNCTION handle_user_sign_in()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update profile
  UPDATE public.profiles
  SET 
    last_sign_in_at = NEW.last_sign_in_at,
    updated_at = NOW()
  WHERE id = NEW.id;

  -- Log activity
  INSERT INTO public.activity_logs (
    user_id,
    organization_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) 
  SELECT
    NEW.id,
    organization_id,
    'user.sign_in',
    'profiles',
    NEW.id,
    jsonb_build_object(
      'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    )
  FROM public.profiles
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_email_verification();

CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION handle_user_sign_in();

-- Add comments for documentation
COMMENT ON FUNCTION handle_new_user IS 'Creates a new profile when a user signs up';
COMMENT ON FUNCTION handle_email_verification IS 'Updates profile status when email is verified';
COMMENT ON FUNCTION handle_user_sign_in IS 'Updates profile and logs when user signs in'; 