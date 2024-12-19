import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jecxswfoepdstrghyouv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY3hzd2ZvZXBkc3RyZ2h5b3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIyMTI5NTEsImV4cCI6MjA0Nzc4ODk1MX0.LbxiCt3dBJC6rEr3n_2WsmY87eUQy7_M-qFtSElB7h8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 