import { createClient } from '@/app/config/supabaseServer'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

type Contingency = Database['public']['Tables']['contingencies']['Row']
type NewContingency = Database['public']['Tables']['contingencies']['Insert']

export async function GET() {
  const supabase = createClient()

  try {
    const { data: contingencies, error } = await supabase
      .from('contingencies')
      .select('*')
      .order('created_at', { ascending: false }) as { data: Contingency[] | null, error: any }

    if (error) throw error

    return NextResponse.json(contingencies)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error fetching contingencies' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()
  const data = await request.json() as NewContingency

  try {
    const { data: newContingency, error } = await supabase
      .from('contingencies')
      .insert([data])
      .select()
      .single() as { data: Contingency | null, error: any }

    if (error) throw error

    return NextResponse.json(newContingency)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error creating contingency' }, { status: 500 })
  }
} 