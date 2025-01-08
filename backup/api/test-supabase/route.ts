import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente admin (service_role)
const adminSupabase = createClient(
  'https://jecxswfoepdstrghyouv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY3hzd2ZvZXBkc3RyZ2h5b3V2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjIxMjk1MSwiZXhwIjoyMDQ3Nzg4OTUxfQ.zaXR1HkRYt2_SuKDx-Tj8u0IEOrDeSUNRLqpcyj6A8c'
)

export async function GET() {
  try {
    // Crear tabla de tareas si no existe
    const { error: createTasksError } = await adminSupabase.rpc('create_tasks_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          priority TEXT NOT NULL DEFAULT 'medium',
          assigned_by TEXT NOT NULL,
          assigned_to TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          due_date TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE
        );
      `
    })

    if (createTasksError) {
      console.error('Error al crear tabla tasks:', createTasksError)
    }

    // Crear tabla de inventario si no existe
    const { error: createInventoryError } = await adminSupabase.rpc('create_inventory_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS inventory (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          quantity INTEGER NOT NULL DEFAULT 0,
          min_stock INTEGER NOT NULL DEFAULT 0,
          category TEXT NOT NULL,
          location TEXT,
          status TEXT NOT NULL DEFAULT 'available',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          last_modified_by TEXT NOT NULL
        );
      `
    })

    if (createInventoryError) {
      console.error('Error al crear tabla inventory:', createInventoryError)
    }

    // Verificar las tablas creadas
    const { data: tasks, error: tasksError } = await adminSupabase
      .from('tasks')
      .select('*')
      .limit(1)

    const { data: inventory, error: inventoryError } = await adminSupabase
      .from('inventory')
      .select('*')
      .limit(1)

    return NextResponse.json({
      message: 'Verificación de tablas completada',
      tasks: {
        exists: !tasksError,
        error: tasksError?.message
      },
      inventory: {
        exists: !inventoryError,
        error: inventoryError?.message
      }
    })
  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json({ error: 'Error al crear las tablas' }, { status: 500 })
  }
} 