'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaClock, FaHourglassHalf } from 'react-icons/fa';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  created_at: string;
  due_date: string;
  area_id: string;
  organization_id: string;
  start_time?: string;
  end_time?: string;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  area?: {
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
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [checklist, setChecklist] = useState<{ id: number; text: string; completed: boolean; }[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentTask();
  }, []);

  const fetchCurrentTask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      console.log('Usuario autenticado:', user.id);

      const { data, error } = await supabase
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
        .eq('assigned_to', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('Error de Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }

      if (data) {
        console.log('Tarea encontrada:', data);
        setCurrentTask(data);
        setStartTime(new Date().toLocaleString());
        
        // Crear lista de verificación desde la descripción
        const taskItems = data.description.split('\n').filter((item: string) => item.trim());
        const formattedChecklist = taskItems.map((text: string, index: number) => ({
          id: index + 1,
          text: text.trim(),
          completed: false
        }));
        setChecklist(formattedChecklist);
      } else {
        console.log('No se encontró ninguna tarea en progreso');
        setCurrentTask(null);
      }
    } catch (error: any) {
      console.error('Error detallado:', {
        message: error.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      });
      toast.error(error.message || 'Error al cargar la tarea actual');
      setError(error.message || 'Error al cargar la tarea actual');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/admin/tasks');
  };

  const handleToggleCheckItem = (id: number) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
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
          onClick={fetchCurrentTask}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header con título y tiempo */}
      <div className="bg-[#4263eb] text-white">
        {/* Barra superior con botón de regresar */}
        <div className="border-b border-blue-400 py-3 px-4">
          <button
            onClick={handleGoBack}
            className="flex items-center text-white hover:text-blue-100"
          >
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Regresar</span>
          </button>
        </div>
        
        {/* Información de la tarea */}
        <div className="p-4">
          <h1 className="text-xl font-medium mb-2">{currentTask.area?.name}</h1>
          <p className="text-sm text-blue-100">
            {new Date(currentTask.created_at).toLocaleDateString()} • {currentTask.start_time} - {currentTask.end_time}
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="px-4 pb-4">
          <div className="bg-blue-400 bg-opacity-30 h-1 rounded-full">
            <div 
              className="bg-white h-1 rounded-full" 
              style={{ width: `${(checklist.filter(item => item.completed).length / checklist.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Hora de inicio */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Hora de inicio</span>
          </div>
          <p className="text-lg font-medium text-gray-900">{startTime}</p>
        </div>

        {/* Lista de verificación */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4">Lista de verificación</h3>
          <div className="space-y-2">
            {checklist.map(item => (
              <div 
                key={item.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleCheckItem(item.id)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <span className={`text-gray-700 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Documentación fotográfica */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4">Documentación fotográfica</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-center text-gray-500">Antes</p>
            </div>
            <div className="space-y-2">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-center text-gray-500">Durante</p>
            </div>
            <div className="space-y-2">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-center text-gray-500">Después</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 