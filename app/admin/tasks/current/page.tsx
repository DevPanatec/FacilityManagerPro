'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaClock, FaHourglassHalf } from 'react-icons/fa';

interface Task {
  id: number;
  description: string;
  area: string;
  status: 'pending' | 'in_progress' | 'completed';
  start_time: string;
  estimated_duration: string;
  checklist: Array<{
    id: number;
    task: string;
    completed: boolean;
  }>;
  photos: {
    before: string | null;
    during: string | null;
    after: string | null;
  };
  users: {
    id: string;
    first_name: string;
    last_name: string;
  };
  areas: {
    id: number;
    name: string;
  };
}

interface CurrentTask {
  id: string;
  title: string;
  description: string;
  priority: 'Alta' | 'Media' | 'Baja';
  area: string;
  checklist: string[];
  start_time?: string;
}

export default function CurrentTaskPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [currentTask, setCurrentTask] = useState<CurrentTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentTask();
  }, []);

  const loadCurrentTask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        throw new Error('Error al obtener el perfil del usuario');
      }

      if (!userProfile) throw new Error('Perfil no encontrado');

      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to (
            first_name,
            last_name
          ),
          area:area_id (
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'in_progress')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (taskError && taskError.code !== 'PGRST116') {
        console.error('Error fetching task:', taskError);
        throw new Error('Error al obtener la tarea actual');
      }

      if (tasks) {
        setCurrentTask({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          priority: tasks.priority,
          area: tasks.area?.name || '',
          start_time: tasks.start_time,
          checklist: tasks.checklist || []
        });
      } else {
        setCurrentTask(null);
      }
    } catch (error: any) {
      console.error('Error loading current task:', error);
      setError(error.message || 'Error al cargar la tarea actual');
      toast.error(error.message || 'Error al cargar la tarea actual');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl font-semibold mb-4">{error}</div>
        <button
          onClick={loadCurrentTask}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tarea en progreso</h3>
          <p className="mt-1 text-sm text-gray-500">
            No hay ninguna tarea en progreso actualmente.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/admin/tasks')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Ver todas las tareas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Navbar secundario */}
      <div className="mb-6 border-b">
        <nav className="flex space-x-8">
          <Link
            href="/admin/tasks"
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              pathname === '/admin/tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Asignaciones
          </Link>
          <Link
            href="/admin/tasks/current"
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              pathname === '/admin/tasks/current'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tarea Actual
          </Link>
        </nav>
      </div>

      {currentTask ? (
        <div className="space-y-6">
          {/* Encabezado con área y prioridad */}
          <div className="bg-blue-600 text-white p-4 rounded-lg flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">{currentTask.area}</h1>
              <p className="mt-1">{currentTask.title}</p>
            </div>
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              Prioridad {currentTask.priority}
            </span>
          </div>

          {/* Información de tiempo */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hora de inicio</p>
                <p className="font-medium">{currentTask.start_time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duración estimada</p>
                <p className="font-medium">--:--:--</p>
              </div>
            </div>
          </div>

          {/* Lista de verificación */}
          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Lista de verificación
            </h2>
            <div className="space-y-3">
              {currentTask.checklist.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 border-2 border-gray-300 rounded-sm focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No hay tarea activa en este momento
        </div>
      )}
    </div>
  );
} 