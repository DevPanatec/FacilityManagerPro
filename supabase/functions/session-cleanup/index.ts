import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRole)

async function cleanupSessions() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sessions, error: queryError } = await supabase
    .from('auth.sessions')
    .select('*')
    .lt('created_at', thirtyDaysAgo.toISOString())
    .limit(100)

  if (queryError) {
    console.error('Error querying sessions:', queryError)
    return
  }

  if (!sessions || sessions.length === 0) {
    console.log('No old sessions found')
    return
  }

  const sessionIds = sessions.map(session => session.id)

  const { error: deleteError } = await supabase
    .from('auth.sessions')
    .delete()
    .in('id', sessionIds)

  if (deleteError) {
    console.error('Error deleting sessions:', deleteError)
    return
  }

  await supabase.rpc('audit.log', {
    action: 'CLEANUP_SESSIONS',
    metadata: {
      sessions_cleaned: sessionIds.length,
      cleaned_at: new Date().toISOString()
    }
  })

  console.log(`Cleaned up ${sessionIds.length} old sessions`)
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await cleanupSessions()
    return new Response(
      JSON.stringify({ message: 'Session cleanup completed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}

Deno.serve(handler) 