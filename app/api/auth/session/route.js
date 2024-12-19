import { auth } from '@/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    
    // Crear cookie de sesión
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Session error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
} 