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

    const { action, turno_id, datos, user_id } = await req.json()

    switch (action) {
      case 'crear':
        // Verificar conflictos de horario
        const { data: conflictos, error: conflictosError } = await supabase
          .from('turnos')
          .select('*')
          .eq('user_id', datos.user_id)
          .overlaps('horario', datos.horario)

        if (conflictosError) throw conflictosError
        if (conflictos && conflictos.length > 0) {
          throw new Error('Existe un conflicto de horarios')
        }

        // Crear nuevo turno
        const { data: nuevoTurno, error: errorCrear } = await supabase
          .from('turnos')
          .insert([datos])
          .select()

        if (errorCrear) throw errorCrear

        return new Response(
          JSON.stringify({ success: true, data: nuevoTurno[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'actualizar':
        const { data: turnoActualizado, error: errorActualizar } = await supabase
          .from('turnos')
          .update(datos)
          .eq('id', turno_id)
          .select()

        if (errorActualizar) throw errorActualizar

        return new Response(
          JSON.stringify({ success: true, data: turnoActualizado[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'eliminar':
        const { error: errorEliminar } = await supabase
          .from('turnos')
          .delete()
          .eq('id', turno_id)

        if (errorEliminar) throw errorEliminar

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'obtener':
        const { data: turnos, error: errorObtener } = await supabase
          .from('turnos')
          .select('*, usuario:usuarios(nombre)')
          .eq('area_id', datos.area_id)
          .gte('fecha', datos.fecha_inicio)
          .lte('fecha', datos.fecha_fin)

        if (errorObtener) throw errorObtener

        return new Response(
          JSON.stringify({ success: true, data: turnos }),
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