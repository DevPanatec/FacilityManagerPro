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

    const { user_id, rango_requerido } = await req.json()

    // Obtener información del usuario
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('rango, area_id')
      .eq('id', user_id)
      .single()

    if (userError) throw userError
    if (!usuario) throw new Error('Usuario no encontrado')

    // Verificar el rango de manera estricta
    const tieneAcceso = verificarAccesoEstricto(usuario.rango, rango_requerido)

    // Si tiene acceso, registrar la verificación
    if (tieneAcceso) {
      await registrarVerificacion(supabase, {
        user_id,
        rango_verificado: rango_requerido,
        resultado: true,
        fecha: new Date().toISOString()
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        tiene_acceso: tieneAcceso,
        usuario: {
          rango: usuario.rango,
          area_id: usuario.area_id
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

function verificarAccesoEstricto(rangoUsuario: string, rangoRequerido: string): boolean {
  // Verificación estricta por tipo de perfil
  switch (rangoUsuario) {
    case 'usuario':
      return rangoRequerido === 'usuario'
    
    case 'enterprise':
      return rangoRequerido === 'enterprise'
    
    case 'admin':
      return rangoRequerido === 'admin'
    
    case 'admin_principal':
      // admin_principal puede ver todo lo de admin más funciones especiales
      return rangoRequerido === 'admin' || rangoRequerido === 'admin_principal'
    
    default:
      return false
  }
}

async function registrarVerificacion(supabase: any, datos: any) {
  await supabase.from('verificaciones_rango').insert([datos])
} 