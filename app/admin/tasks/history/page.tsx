'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaTasks, FaClock, FaCheckCircle, FaTools, FaSpinner } from 'react-icons/fa';
import { MdPendingActions, MdOutlineCleaningServices } from 'react-icons/md';

interface Task {
  id: number;
  description: string;
  area: string;
  status: 'pending' | 'in_progress' | 'completed';
  start_time: string;
  completed_at: string | null;
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

export default function TaskHistoryPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Error al cargar las tareas');
      toast.error('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return baseClasses;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      completed: 'Completada',
      in_progress: 'En Progreso',
      pending: 'Pendiente'
    };
    return statusMap[status] || status;
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
          onClick={loadTasks}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FaTasks className="text-blue-200" />
                Historial de Tareas
              </h1>
              <p className="mt-2 text-blue-100 flex items-center gap-2">
                <MdOutlineCleaningServices />
                Registro histórico de todas las tareas
              </p>
            </div>
            <button
              onClick={loadTasks}
              className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
              title="Recargar historial"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
          <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg p-6 border border-yellow-100">
            <div className="flex items-center gap-2 text-yellow-600">
              <MdPendingActions className="text-2xl" />
              <div className="text-sm font-medium">Tareas Pendientes</div>
            </div>
            <div className="mt-2 text-3xl font-bold text-yellow-700">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600">
              <FaSpinner className="text-2xl" />
              <div className="text-sm font-medium">En Progreso</div>
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-700">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center gap-2 text-green-600">
              <FaCheckCircle className="text-2xl" />
              <div className="text-sm font-medium">Completadas</div>
            </div>
            <div className="mt-2 text-3xl font-bold text-green-700">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FaTasks className="text-blue-600" />
                Todas las tareas
              </h3>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se han encontrado tareas en el historial.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <li key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className={`${getStatusBadgeClass(task.status)} flex items-center gap-1`}>
                            {task.status === 'pending' && <FaClock />}
                            {task.status === 'in_progress' && <FaSpinner className="animate-spin" />}
                            {task.status === 'completed' && <FaCheckCircle />}
                            {getStatusText(task.status)}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FaTools className="text-gray-400" />
                            {task.completed_at || task.start_time}
                          </span>
                        </div>
                        <p className="mt-2 text-lg font-medium text-gray-900">{task.areas?.name}</p>
                        <p className="mt-1 text-gray-500">{task.description}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          Asignado a: {task.users?.first_name} {task.users?.last_name}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => router.push(`/admin/tasks/${task.id}`)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 