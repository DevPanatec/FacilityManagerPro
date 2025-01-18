'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Assignment {
  id: number;
  description: string;
  area: string;
  date: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  photos: string[];
  user: {
    id: string;
    first_name: string;
    last_name: string;
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
  area_id: number;
  user_id: string;
}

export default function AdminTasksPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Usuario no encontrado');

      const { data: assignments, error } = await supabase
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

      setAssignments(assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError('Error al cargar las asignaciones');
      toast.error('Error al cargar las asignaciones');
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
          onClick={loadAssignments}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className='bg-gradient-to-r from-blue-600 to-blue-800 shadow-md rounded-lg p-6 mb-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
              <svg 
                className='w-6 h-6 text-white' 
                fill='none' 
                stroke='currentColor' 
                viewBox='0 0 24 24'
              >
                <path 
                  strokeLinecap='round' 
                  strokeLinejoin='round' 
                  strokeWidth={2} 
                  d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                />
              </svg>
              Gestión de Tareas
            </h1>
            <p className="mt-2 text-blue-100">
              Vista general de todas las tareas asignadas
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/admin/assignments')}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Nueva Asignación
            </button>
            <button
              onClick={loadAssignments}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
              title="Recargar tareas"
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
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg p-6 border border-yellow-100">
          <div className="flex items-center gap-2 text-yellow-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium">Tareas Pendientes</div>
          </div>
          <div className="mt-2 text-3xl font-bold text-yellow-700">
            {assignments.filter(t => t.status === 'pending').length}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="text-sm font-medium">En Progreso</div>
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-700">
            {assignments.filter(t => t.status === 'in_progress').length}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium">Completadas</div>
          </div>
          <div className="mt-2 text-3xl font-bold text-green-700">
            {assignments.filter(t => t.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="grid gap-6">
        {assignments.length === 0 ? (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva asignación.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/admin/assignments')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Nueva Asignación
              </button>
            </div>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div 
              key={assignment.id}
              className={`
                bg-white rounded-xl shadow-md p-6
                ${assignment.status === 'pending' ? 'border-l-4 border-yellow-400' :
                  assignment.status === 'in_progress' ? 'border-l-4 border-blue-500' :
                  'border-l-4 border-green-500'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{assignment.areas?.name}</h3>
                  <p className="text-sm text-gray-600">
                    Asignado a: {assignment.users?.first_name} {assignment.users?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Fecha límite: {new Date(assignment.due_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={getStatusBadgeClass(assignment.status)}>
                  {getStatusText(assignment.status)}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{assignment.description}</p>

              <div className="mt-4 flex justify-end space-x-4">
                <button
                  onClick={() => router.push(`/admin/tasks/${assignment.id}`)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 