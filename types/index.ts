import { Database } from './supabase'

declare global {
  type DBTypes = Database
} 