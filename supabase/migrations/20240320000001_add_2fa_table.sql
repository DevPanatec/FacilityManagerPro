-- Create the user_2fa table
CREATE TABLE IF NOT EXISTS user_2fa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings"
    ON user_2fa
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings"
    ON user_2fa
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for inserting 2FA settings (only through server-side functions)
CREATE POLICY "Server can insert 2FA settings"
    ON user_2fa
    FOR INSERT
    WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_2fa_updated_at
    BEFORE UPDATE ON user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX idx_user_2fa_enabled ON user_2fa(enabled);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_2fa TO authenticated;
GRANT USAGE ON SEQUENCE user_2fa_id_seq TO authenticated; 