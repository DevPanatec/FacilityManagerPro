'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente del navegador
export const createBrowserSupabaseClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

export const baseGlobalConfig = {
  global: {
    headers: { 'x-my-custom-header': 'facility-manager-pro' },
  },
} 