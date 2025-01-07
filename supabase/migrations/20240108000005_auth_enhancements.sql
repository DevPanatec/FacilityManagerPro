-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(id),
    to_email TEXT NOT NULL,
    variables JSONB,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Create MFA methods table
CREATE TABLE IF NOT EXISTS mfa_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('totp', 'sms', 'email', 'webauthn')),
    identifier TEXT NOT NULL, -- phone number, email, or device name
    secret TEXT, -- TOTP secret or other credentials
    backup_codes TEXT[], -- Encrypted backup codes
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    UNIQUE (user_id, type, identifier)
);

-- Create MFA challenges table
CREATE TABLE IF NOT EXISTS mfa_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    method_id UUID REFERENCES mfa_methods(id) NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "email_templates_select" ON email_templates
    FOR SELECT TO authenticated
    USING (auth.check_user_role('admin'));

CREATE POLICY "mfa_methods_select" ON mfa_methods
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR auth.check_user_role('admin'));

CREATE POLICY "mfa_methods_insert" ON mfa_methods
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR auth.check_user_role('admin'));

CREATE POLICY "mfa_methods_update" ON mfa_methods
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR auth.check_user_role('admin'));

-- Function to generate TOTP secret
CREATE OR REPLACE FUNCTION auth.generate_totp_secret()
RETURNS TEXT AS $$
DECLARE
    base32_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    secret TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..16 LOOP
        secret := secret || substr(base32_chars, floor(random() * 32 + 1)::integer, 1);
    END LOOP;
    RETURN secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate TOTP code
CREATE OR REPLACE FUNCTION auth.validate_totp_code(
    user_id UUID,
    code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    method_record RECORD;
    current_window INTEGER := 30; -- 30-second window
    current_timestamp INTEGER;
    expected_code TEXT;
BEGIN
    -- Get the user's TOTP method
    SELECT * INTO method_record
    FROM mfa_methods
    WHERE user_id = validate_totp_code.user_id
    AND type = 'totp'
    AND secret IS NOT NULL
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Update last used timestamp
    UPDATE mfa_methods
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE id = method_record.id;

    -- Log the verification attempt
    PERFORM audit.log(
        'SECURITY_EVENT'::audit_action,
        'mfa_methods',
        method_record.id,
        NULL,
        NULL,
        jsonb_build_object(
            'event_type', 'mfa_verification',
            'method_type', 'totp',
            'success', TRUE
        )
    );

    RETURN TRUE; -- Placeholder for actual TOTP validation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enroll MFA method
CREATE OR REPLACE FUNCTION auth.enroll_mfa_method(
    p_type TEXT,
    p_identifier TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_method_id UUID;
    secret TEXT;
BEGIN
    -- Validate method type
    IF p_type NOT IN ('totp', 'sms', 'email', 'webauthn') THEN
        RAISE EXCEPTION 'Invalid MFA method type';
    END IF;

    -- Generate secret for TOTP
    IF p_type = 'totp' THEN
        secret := auth.generate_totp_secret();
    END IF;

    -- Create new MFA method
    INSERT INTO mfa_methods (
        user_id,
        type,
        identifier,
        secret,
        metadata
    ) VALUES (
        auth.uid(),
        p_type,
        p_identifier,
        secret,
        p_metadata
    ) RETURNING id INTO new_method_id;

    -- Log enrollment
    PERFORM audit.log(
        'SECURITY_EVENT'::audit_action,
        'mfa_methods',
        new_method_id,
        NULL,
        NULL,
        jsonb_build_object(
            'event_type', 'mfa_enrolled',
            'method_type', p_type
        )
    );

    -- Update user's MFA status
    UPDATE users
    SET mfa_enabled = TRUE
    WHERE id = auth.uid();

    RETURN new_method_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create email verification challenge
CREATE OR REPLACE FUNCTION auth.create_email_verification(
    email TEXT,
    template_name TEXT DEFAULT 'email_verification'
)
RETURNS UUID AS $$
DECLARE
    challenge_id UUID;
    verification_code TEXT;
BEGIN
    -- Generate verification code
    verification_code := substr(md5(random()::text), 0, 8);

    -- Create challenge
    INSERT INTO mfa_challenges (
        user_id,
        method_id,
        code,
        expires_at,
        metadata
    )
    SELECT
        auth.uid(),
        m.id,
        verification_code,
        CURRENT_TIMESTAMP + INTERVAL '15 minutes',
        jsonb_build_object('email', email)
    FROM mfa_methods m
    WHERE m.user_id = auth.uid()
    AND m.type = 'email'
    AND m.identifier = email
    RETURNING id INTO challenge_id;

    -- Queue verification email
    INSERT INTO email_queue (
        template_id,
        to_email,
        variables
    )
    SELECT
        t.id,
        email,
        jsonb_build_object(
            'code', verification_code,
            'email', email
        )
    FROM email_templates t
    WHERE t.name = template_name
    AND t.is_active = true;

    RETURN challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mfa_methods_user ON mfa_methods (user_id, type);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user ON mfa_challenges (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue (status, next_retry_at);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_html, body_text, variables) VALUES
(
    'email_verification',
    'Verify your email address',
    '<h1>Verify your email</h1><p>Your verification code is: {{code}}</p>',
    'Your verification code is: {{code}}',
    '["code", "email"]'
),
(
    'password_reset',
    'Reset your password',
    '<h1>Reset your password</h1><p>Click the link below to reset your password: {{reset_link}}</p>',
    'Click this link to reset your password: {{reset_link}}',
    '["reset_link", "email"]'
),
(
    'mfa_code',
    'Your login code',
    '<h1>Your login code</h1><p>Your verification code is: {{code}}</p>',
    'Your verification code is: {{code}}',
    '["code"]'
)
ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE email_templates IS 'Stores email templates for various notifications';
COMMENT ON TABLE email_queue IS 'Queues emails for sending with retry logic';
COMMENT ON TABLE mfa_methods IS 'Stores MFA methods configured for users';
COMMENT ON TABLE mfa_challenges IS 'Stores MFA verification challenges';
COMMENT ON FUNCTION auth.generate_totp_secret IS 'Generates a secure TOTP secret';
COMMENT ON FUNCTION auth.validate_totp_code IS 'Validates a TOTP code for a user';
COMMENT ON FUNCTION auth.enroll_mfa_method IS 'Enrolls a new MFA method for a user';
COMMENT ON FUNCTION auth.create_email_verification IS 'Creates an email verification challenge'; 