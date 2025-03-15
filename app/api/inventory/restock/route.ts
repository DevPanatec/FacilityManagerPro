import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Esto evita el cacheo del endpoint

export async function GET(request: Request) {
  try {
    // Obtener el ID del item de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    
    if (!itemId) {
      return NextResponse.json({ error: 'Se requiere el ID del item' }, { status: 400 });
    }
    
    // Crear cliente de Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    console.log(`API: Consultando historial de reposición para item ${itemId}`);
    
    // Consultar registros de reposición
    const { data, error } = await supabase
      .from('inventory_restock')
      .select('*')
      .eq('inventory_id', itemId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error al consultar reposiciones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`API: Se encontraron ${data?.length || 0} registros de reposición`);
    
    // Devolver los datos
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error en API de reposición:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 