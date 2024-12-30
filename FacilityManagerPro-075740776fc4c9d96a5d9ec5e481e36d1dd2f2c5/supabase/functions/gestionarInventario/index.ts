import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { action, producto_id, datos } = await req.json()

    switch (action) {
      case 'agregar':
        const { data: nuevoProducto, error: errorAgregar } = await supabase
          .from('inventario')
          .insert([datos])
          .select()

        if (errorAgregar) throw errorAgregar

        return new Response(
          JSON.stringify({ success: true, data: nuevoProducto[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'actualizar':
        const { data: productoActualizado, error: errorActualizar } = await supabase
          .from('inventario')
          .update(datos)
          .eq('id', producto_id)
          .select()

        if (errorActualizar) throw errorActualizar

        return new Response(
          JSON.stringify({ success: true, data: productoActualizado[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'eliminar':
        const { error: errorEliminar } = await supabase
          .from('inventario')
          .delete()
          .eq('id', producto_id)

        if (errorEliminar) throw errorEliminar

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'obtener':
        const { data: productos, error: errorObtener } = await supabase
          .from('inventario')
          .select('*')
          .eq('area_id', datos.area_id)

        if (errorObtener) throw errorObtener

        return new Response(
          JSON.stringify({ success: true, data: productos }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Acción no válida')
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
}) 