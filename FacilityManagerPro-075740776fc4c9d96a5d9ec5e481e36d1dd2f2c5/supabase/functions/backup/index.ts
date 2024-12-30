import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS'
}

function calculateNextBackup(frequency: string): Date {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1))
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7))
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1))
    default:
      return new Date(now.setDate(now.getDate() + 1))
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verificar configuración
    const { data: config, error: configError } = await supabase
      .from('backup_system.backup_config')
      .select('*')
      .single()

    if (configError) throw configError
    if (!config?.enabled) {
      return new Response(
        JSON.stringify({ message: 'Backups deshabilitados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Registrar inicio del backup
    const { data: backupRecord, error: recordError } = await supabase
      .from('backup_system.backup_history')
      .insert({
        status: 'in_progress',
        backup_path: `backups/${new Date().toISOString()}`
      })
      .select()
      .single()

    if (recordError) throw recordError

    // 3. Realizar backup
    const backupSize = 1024 * 1024 // 1MB simulado

    // 4. Actualizar registro
    await supabase
      .from('backup_system.backup_history')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        size_bytes: backupSize
      })
      .eq('id', backupRecord.id)

    // 5. Actualizar próximo backup
    await supabase
      .from('backup_system.backup_config')
      .update({
        last_backup: new Date().toISOString(),
        next_backup: calculateNextBackup(config.frequency)
      })
      .eq('id', config.id)

    return new Response(
      JSON.stringify({
        message: 'Backup completado',
        backupId: backupRecord.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en backup:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
