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

    const { producto_id, cantidad, user_id } = await req.json()

    // Verificar stock actual
    const { data: producto, error: errorProducto } = await supabase
      .from('inventario')
      .select('cantidad, nivel_minimo')
      .eq('id', producto_id)
      .single()

    if (errorProducto) throw errorProducto
    if (!producto) throw new Error('Producto no encontrado')
    if (producto.cantidad < cantidad) throw new Error('Stock insuficiente')

    // Registrar uso
    const { data: uso, error: errorUso } = await supabase
      .from('uso_productos')
      .insert([{
        producto_id,
        cantidad,
        user_id,
        fecha: new Date().toISOString()
      }])
      .select()

    if (errorUso) throw errorUso

    // Actualizar stock
    const nuevaCantidad = producto.cantidad - cantidad
    const { error: errorActualizar } = await supabase
      .from('inventario')
      .update({ cantidad: nuevaCantidad })
      .eq('id', producto_id)

    if (errorActualizar) throw errorActualizar

    // Verificar si se alcanzó el nivel mínimo
    if (nuevaCantidad <= producto.nivel_minimo) {
      await supabase.from('alertas').insert([{
        tipo: 'bajo_stock',
        producto_id,
        nivel: 'alto',
        detalles: {
          cantidad_actual: nuevaCantidad,
          nivel_minimo: producto.nivel_minimo
        }
      }])
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          uso: uso[0],
          stock_actual: nuevaCantidad
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

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