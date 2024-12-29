import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function refreshSession(currentSession: any) {
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession({
    refresh_token: currentSession.refresh_token,
  });

  if (error) {
    throw error;
  }

  return session;
}

export async function revokeSession(sessionId: string) {
  await supabase.from('sessions').update({
    revoked: true,
    revoked_at: new Date().toISOString(),
  }).eq('id', sessionId);
}

export async function checkSessionValidity(session: any) {
  // Verificar si la sesión está revocada
  const { data: sessionData } = await supabase
    .from('sessions')
    .select('revoked, revoked_at')
    .eq('id', session.id)
    .single();

  if (sessionData?.revoked) {
    return false;
  }

  // Verificar tiempo máximo de sesión (8 horas)
  const sessionStart = new Date(session.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);

  return hoursDiff <= 8;
} 