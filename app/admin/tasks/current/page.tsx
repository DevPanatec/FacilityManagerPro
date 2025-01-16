'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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

export default function CurrentTaskPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
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

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      const { data: tasks, error } = await supabase
        .from('assignments')
        .select(`
          *,
          users:user_id (
            id,
            first_name,
            last_name
          ),
          areas:area_id (
            id,
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      setCurrentTask(tasks);
    } catch (error) {
      console.error('Error loading current task:', error);
      setError('Error al cargar la tarea actual');
      toast.error('Error al cargar la tarea actual');
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
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="text-white">
              <h3 className="text-3xl font-bold tracking-tight">{currentTask.areas?.name}</h3>
              <p className="mt-2 text-blue-100 text-lg">{currentTask.description}</p>
              <p className="mt-2 text-blue-200">
                Asignado a: {currentTask.users?.first_name} {currentTask.users?.last_name}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-500 text-white shadow-lg">
                En Progreso
              </span>
              <span className="mt-2 text-blue-100">
                ID: {currentTask.id}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-lg border border-indigo-100">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <FaClock className="text-indigo-600 text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Hora de inicio</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {new Date(currentTask.start_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl shadow-lg border border-purple-100">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <FaHourglassHalf className="text-purple-600 text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">Duración estimada</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {currentTask.estimated_duration}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            {currentTask.checklist && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Lista de verificación</h4>
                <div className="space-y-4">
                  {currentTask.checklist.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        readOnly
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className={`text-gray-700 ${item.completed ? 'line-through' : ''}`}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos */}
            {currentTask.photos && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Documentación fotográfica</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Antes</h5>
                    {currentTask.photos.before ? (
                      <div className="relative aspect-square">
                        <Image
                          src={currentTask.photos.before}
                          alt="Antes"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Pendiente</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Durante</h5>
                    {currentTask.photos.during ? (
                      <div className="relative aspect-square">
                        <Image
                          src={currentTask.photos.during}
                          alt="Durante"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Pendiente</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Después</h5>
                    {currentTask.photos.after ? (
                      <div className="relative aspect-square">
                        <Image
                          src={currentTask.photos.after}
                          alt="Después"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Pendiente</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 