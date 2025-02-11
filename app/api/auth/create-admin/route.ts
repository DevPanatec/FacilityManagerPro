import { createServerSupabaseClient } from '@/app/lib/supabase/config.server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const adminEmail = 'admin@facilitymanagerpro.com'
const adminPassword = 'Admin@FMP2024'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // 1. Crear el usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })
    
    if (authError) {
      console.error('Error al crear usuario:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message 
      }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo crear el usuario' 
      }, { status: 500 })
    }

    // 2. Insertar/Actualizar en la tabla users con rol admin
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: adminEmail,
        role: 'admin',
        first_name: 'Admin',
        last_name: 'System',
        updated_at: new Date().toISOString()
      })

    if (userError) {
      console.error('Error al crear perfil de usuario:', userError)
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario administrador creado exitosamente',
      user: {
        id: authData.user.id,
        email: adminEmail,
        role: 'admin'
      }
    })
    
  } catch (error) {
    console.error('Error al crear usuario admin:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json();
    const { email, password, firstName, lastName, organizationId } = body;

    // 1. Validar datos
    if (!email || !password || !firstName || !lastName || !organizationId) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos' 
      }, { status: 400 });
    }

    // 2. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        organization_id: organizationId,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creando usuario:', authError);
      return NextResponse.json({ 
        error: 'Error al crear el usuario' 
      }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'No se pudo crear el usuario' 
      }, { status: 500 });
    }

    // 3. Crear/actualizar datos del usuario en la tabla users
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        organization_id: organizationId,
        role: 'admin',
        updated_at: new Date().toISOString()
      });

    if (userError) {
      console.error('Error creando perfil:', userError);
      // Intentar eliminar el usuario de auth si falla la creación del perfil
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ 
        error: 'Error al crear el perfil del usuario' 
      }, { status: 500 });
    }

    // 4. Crear sala de chat por defecto para el admin
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        organization_id: organizationId,
        name: 'General',
        type: 'channel',
        created_by: authData.user.id,
        is_private: false
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creando sala de chat:', roomError);
      return NextResponse.json({ 
        error: 'Error al crear la sala de chat' 
      }, { status: 500 });
    }

    // 5. Agregar admin como miembro de la sala
    const { error: chatError } = await supabase
      .from('chat_room_members')
      .insert({
        user_id: authData.user.id,
        organization_id: organizationId,
        room_id: roomData.id,
        role: 'admin',
        status: 'active'
      });

    if (chatError) {
      console.error('Error configurando chat:', chatError);
      // No revertimos la creación del usuario por este error
    }

    return NextResponse.json({
      message: 'Administrador creado exitosamente',
      user: authData.user
    }, { status: 201 });

  } catch (error) {
    console.error('Error en create-admin:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 