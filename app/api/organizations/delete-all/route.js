import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE() {
  try {
    // Eliminar todas las organizaciones
    const { error } = await supabase
      .from('organizations')
      .delete()
      .neq('id', 0);

    if (error) {
      console.error('Error Supabase:', error);
      throw error;
    }

    // Reiniciar la secuencia de IDs
    await supabase.rpc('reset_organizations_sequence');

    return NextResponse.json({ 
      success: true,
      message: 'Todas las organizaciones han sido eliminadas'
    });
  } catch (error) {
    console.error('Error al eliminar:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar organizaciones' },
      { status: 500 }
    );
  }
} 