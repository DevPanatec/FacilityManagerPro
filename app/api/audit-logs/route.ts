import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    
    // Validar parámetros
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    
    // Obtener parámetros de consulta
    const table_name = url.searchParams.get('table_name');
    const action = url.searchParams.get('action');
    const from_date = url.searchParams.get('from_date');
    const to_date = url.searchParams.get('to_date');

    let query = supabase
      .from('system_audit_logs')
      .select(`
        *,
        changed_by (
          id,
          email
        )
      `)
      .order('changed_at', { ascending: false });

    // Aplicar filtros
    if (table_name) {
      query = query.eq('table_name', table_name);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (from_date) {
      query = query.gte('changed_at', from_date);
    }
    if (to_date) {
      query = query.lte('changed_at', to_date);
    }

    // Paginación
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      data,
      page,
      limit,
      total: count
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
