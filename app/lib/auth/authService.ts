import { createClient } from '@supabase/supabase-js';
import { authenticator } from 'otplib';
import { checkRateLimit } from '../security/rateLimit';
import { sendEmail } from '../email/templates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class AuthService {
  async handleLoginAttempt(email: string, ip: string) {
    // Verificar rate limit
    const canAttempt = await checkRateLimit('/api/auth/login', 'user', ip);
    if (!canAttempt) {
      throw new Error('Too many attempts. Please try again later.');
    }

    // Verificar si el usuario está bloqueado
    const { data: lockData } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', email)
      .single();

    if (lockData?.is_locked && lockData.locked_until > new Date()) {
      throw new Error(`Account is locked. Try again after ${lockData.locked_until}`);
    }

    return true;
  }

  async recordFailedAttempt(email: string, ip: string) {
    const { data: settings } = await supabase
      .from('auth_settings')
      .select('*')
      .single();

    const { data: attempts } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', email)
      .single();

    if (attempts) {
      const newCount = attempts.attempt_count + 1;
      const shouldLock = newCount >= settings.max_login_attempts;

      await supabase
        .from('failed_login_attempts')
        .update({
          attempt_count: newCount,
          last_attempt: new Date().toISOString(),
          is_locked: shouldLock,
          locked_until: shouldLock 
            ? new Date(Date.now() + settings.lockout_duration_minutes * 60000).toISOString()
            : null
        })
        .eq('email', email);

      if (shouldLock) {
        await sendEmail(email, 'ACCOUNT_LOCKED', {
          duration: `${settings.lockout_duration_minutes} minutes`
        });
      }
    } else {
      await supabase
        .from('failed_login_attempts')
        .insert({
          email,
          ip_address: ip,
          attempt_count: 1,
          last_attempt: new Date().toISOString()
        });
    }
  }

  async setup2FA(userId: string) {
    const secret = authenticator.generateSecret();
    
    // Generar códigos de respaldo
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substr(2, 8)
    );

    await supabase
      .from('user_2fa')
      .insert({
        user_id: userId,
        secret_key: secret,
        backup_codes: backupCodes
      });

    return {
      secret,
      backupCodes,
      qrCode: authenticator.keyuri(userId, 'TuApp', secret)
    };
  }

  async verify2FA(userId: string, token: string) {
    const { data: twoFAData } = await supabase
      .from('user_2fa')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!twoFAData || !twoFAData.is_enabled) {
      return false;
    }

    return authenticator.verify({
      token,
      secret: twoFAData.secret_key
    });
  }
} 