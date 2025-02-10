'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaClock, FaHourglassHalf, FaCheckCircle, FaExclamationCircle, FaRegClock, FaListUl, FaUserCircle, FaBuilding } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Database } from '@/lib/types/database';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  created_at: string;
  due_date: string;
  area_id: string;
  organization_id: string;
  start_time?: string;
  end_time?: string;
  parent_task_id?: string;
  sala_id?: string;
  estimated_hours?: number;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  area?: {
    name: string;
  };
  sala?: {
    nombre: string;
  };
  subtasks?: Task[];
  progress?: number;
}

export default function CurrentTaskPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClientComponentClient<Database>());
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [checklist, setChecklist] = useState<{ id: number; text: string; completed: boolean; }[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState({
    before: null,
    during: null,
    after: null
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchCurrentTask();
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      if (startTime) {
        try {
          // Crear una fecha base para hoy
          const today = new Date();
          const [hours, minutes, seconds] = startTime.split(':').map(Number);
          
          // Establecer las horas, minutos y segundos en la fecha base
          today.setHours(hours, minutes, seconds);

          const elapsed = formatDistanceToNow(today, { locale: es, addSuffix: false });
          setElapsedTime(elapsed);
        } catch (error) {
          console.error('Error al calcular el tiempo transcurrido:', error);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, mounted]);

  const fetchCurrentTask = async () => {
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

      if (!userProfile) throw new Error('Perfil no encontrado');

      console.log('Buscando tarea principal para:', {
        userId: user.id,
        organizationId: userProfile.organization_id
      });

      // 1. Obtener la tarea principal en progreso
      const { data: mainTask, error: mainTaskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!tasks_assigned_to_fkey(
            first_name,
            last_name
          ),
          area:areas!inner(
            name,
            id
          ),
          sala:salas!inner(
            nombre,
            id
          )
        `)
        .eq('assigned_to', user.id)
        .eq('status', 'in_progress')
        .eq('type', 'assignment')
        .is('parent_task_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (mainTaskError) {
        console.error('Error al obtener tarea principal:', mainTaskError);
        
        // Si no se encuentra ninguna tarea, manejarlo como un caso especial
        if (mainTaskError.code === 'PGRST116') {
          console.log('No se encontró ninguna tarea en progreso');
          setCurrentTask(null);
          setLoading(false);
          return;
        }
        
        throw new Error('Error al obtener tarea principal');
      }

      if (!mainTask) {
        console.log('No se encontró tarea principal');
        setCurrentTask(null);
        setLoading(false);
        return;
      }

      console.log('Tarea principal encontrada:', {
        id: mainTask.id,
        title: mainTask.title,
        status: mainTask.status,
        area: mainTask.area?.[0]?.name
      });

      // Obtener las tareas del área
      const { data: areaTasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          estimated_hours,
          created_at
        `)
        .eq('area_id', mainTask.area_id)
        .eq('status', 'pending');

      if (tasksError) {
        console.error('Error al obtener tareas del área:', tasksError);
        throw new Error('Error al obtener tareas del área');
      }

      console.log('Tareas del área encontradas:', areaTasks);

      // Formatear las tareas
      const formattedTasks = areaTasks?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as Task['status'],
        priority: task.priority as Task['priority'],
        assigned_to: mainTask.assigned_to,
        created_at: mainTask.created_at,
        due_date: mainTask.due_date,
        area_id: mainTask.area_id,
        organization_id: mainTask.organization_id,
        estimated_hours: task.estimated_hours
      })) || [];

      // 3. Calcular el progreso basado en tareas completadas
      const completedTasks = formattedTasks.filter(task => task.status === 'completed').length;
      const totalTasks = formattedTasks.length;
      const currentProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // 4. Formatear la tarea principal con las tareas del área
      const formattedTask: Task = {
        id: mainTask.id,
        title: mainTask.title,
        description: mainTask.description,
        status: mainTask.status,
        priority: mainTask.priority,
        assigned_to: mainTask.assigned_to,
        created_at: mainTask.created_at,
        due_date: mainTask.due_date,
        area_id: mainTask.area_id,
        organization_id: mainTask.organization_id,
        start_time: mainTask.start_time,
        end_time: mainTask.end_time,
        sala_id: mainTask.sala_id,
        assignee: mainTask.assignee?.[0],
        area: mainTask.area?.[0],
        sala: mainTask.sala?.[0],
        subtasks: formattedTasks,
        progress: currentProgress
      };

      console.log('Tarea formateada con pasos:', formattedTask);

      setCurrentTask(formattedTask);
      setProgress(currentProgress);
      setStartTime(mainTask.start_time || '');

    } catch (error: any) {
      console.error('Error al cargar la tarea:', error);
      setError(error.message || 'Error al cargar la tarea');
      toast.error('Error al cargar la tarea actual');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask) return;

    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          end_time: timeString,
          updated_at: now.toISOString()
        })
        .eq('id', currentTask.id);

      if (updateError) throw updateError;

      // También actualizar todas las subtareas como completadas
      if (currentTask.subtasks && currentTask.subtasks.length > 0) {
        const { error: subtasksError } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            end_time: timeString,
            updated_at: now.toISOString()
          })
          .in('id', currentTask.subtasks.map(task => task.id));

        if (subtasksError) throw subtasksError;
      }

      toast.success('Tarea completada con éxito');
      router.push('/admin/tasks');
    } catch (error: any) {
      console.error('Error al completar la tarea:', error);
      toast.error('Error al completar la tarea');
    }
  };

  const handleToggleCheckItem = (id: number) => {
    setChecklist(prev => {
      const newChecklist = prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      const completed = newChecklist.filter(item => item.completed).length;
      setProgress((completed / newChecklist.length) * 100);
      return newChecklist;
    });
  };

  const handleSaveNotes = async () => {
    try {
      if (!currentTask) return;

      const { error } = await supabase
        .from('task_notes')
        .upsert({
          task_id: currentTask.id,
          notes: notes,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Notas guardadas correctamente');
    } catch (error) {
      toast.error('Error al guardar las notas');
    }
  };

  const handleSubtaskStatusChange = async (subtask: Task) => {
    try {
      const newStatus = subtask.status === 'completed' ? 'in_progress' : 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', subtask.id);
      
      if (error) throw error;
      
      // Actualizar el estado local
      const updatedSubtasks = currentTask?.subtasks?.map(t => 
        t.id === subtask.id ? { ...t, status: newStatus as Task['status'] } : t
      );
      
      if (currentTask && updatedSubtasks) {
        setCurrentTask({
          ...currentTask,
          subtasks: updatedSubtasks
        });
        
        // Actualizar el progreso
        const completed = updatedSubtasks.filter(t => t.status === 'completed').length;
        const total = updatedSubtasks.length;
        setProgress(Math.round((completed / total) * 100));
      }
    } catch (error) {
      console.error('Error al actualizar subtarea:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Confirmar con el usuario antes de eliminar
      if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Actualizar el estado local eliminando la tarea
      if (currentTask && currentTask.subtasks) {
        const updatedSubtasks = currentTask.subtasks.filter(task => task.id !== taskId);
        setCurrentTask({
          ...currentTask,
          subtasks: updatedSubtasks
        });

        // Actualizar el progreso
        const completed = updatedSubtasks.filter(t => t.status === 'completed').length;
        const total = updatedSubtasks.length;
        setProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
      }

      toast.success('Tarea eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      if (!currentTask) return;

      // Confirmar con el usuario antes de eliminar
      if (!confirm('¿Estás seguro de que deseas eliminar esta asignación y todas sus tareas asociadas?')) {
        return;
      }

      // Primero eliminar todas las subtareas
      if (currentTask.subtasks && currentTask.subtasks.length > 0) {
        const { error: subtasksError } = await supabase
          .from('tasks')
          .delete()
          .in('id', currentTask.subtasks.map(task => task.id));

        if (subtasksError) throw subtasksError;
      }

      // Luego eliminar la tarea principal
      const { error: mainTaskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', currentTask.id);

      if (mainTaskError) throw mainTaskError;

      toast.success('Asignación eliminada correctamente');
      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error al eliminar la asignación:', error);
      toast.error('Error al eliminar la asignación');
    }
  };

  const handleImageUpload = async (type: 'before' | 'during' | 'after', file: File) => {
    try {
      setUploading(true);
      
      if (!currentTask) {
        throw new Error('No hay tarea seleccionada');
      }

      // Verificar autenticación
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Usuario no autenticado');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;

      console.log('Iniciando subida de archivo:', {
        bucket: 'attachments',
        fileName,
        fileSize: file.size,
        fileType: file.type,
        userId: session.user.id
      });

      // Subir la imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        throw new Error('Error al subir archivo a Storage');
      }

      console.log('Archivo subido exitosamente:', uploadData);

      // Obtener la URL pública
      const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen');
      }

      console.log('URL pública obtenida:', data.publicUrl);

      // Actualizar el registro en la base de datos
      const { error: updateError } = await supabase
        .from('task_images')
        .upsert({
          task_id: currentTask.id,
          image_type: type,
          image_url: data.publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error al actualizar registro:', updateError);
        throw new Error('Error al guardar registro en la base de datos');
      }

      // Actualizar el estado local
      setImages(prev => ({
        ...prev,
        [type]: data.publicUrl
      }));

      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      console.error('Error al subir la imagen:', error);
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = (type: 'before' | 'during' | 'after') => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-type', type);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = e.target.getAttribute('data-type') as 'before' | 'during' | 'after';
    
    if (file && type) {
      handleImageUpload(type, file);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FaExclamationCircle className="text-red-500 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FaRegClock className="text-gray-400 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No hay tarea en progreso</h2>
        <p className="text-gray-600">Inicia una tarea desde la lista de tareas pendientes</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Tareas {currentTask?.sala?.nombre || ''}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              <FaClock className="inline mr-2" />
              {elapsedTime}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles de la Asignación</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <FaBuilding className="text-gray-500 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-700">Ubicación</p>
                  <p className="text-gray-600">{currentTask.sala?.nombre || 'No especificado'} - {currentTask.area?.name || 'No especificado'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaUserCircle className="text-gray-500 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-700">Asignado a</p>
                  <p className="text-gray-600">
                    {currentTask.assignee 
                      ? `${currentTask.assignee.first_name} ${currentTask.assignee.last_name}`
                      : 'No asignado'}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <FaHourglassHalf className="text-gray-500 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-700">Horario</p>
                  <p className="text-gray-600">
                    {currentTask.start_time || ''} - {currentTask.end_time || ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pasos a Realizar</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {currentTask.subtasks && currentTask.subtasks.map((subtask, index) => (
                <div key={subtask.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={subtask.status === 'completed'}
                    onChange={() => handleSubtaskStatusChange(subtask)}
                    className="form-checkbox h-5 w-5 text-blue-600 mt-1 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`${subtask.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {subtask.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        {subtask.estimated_hours && (
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            <FaClock className="inline mr-1" />
                            {subtask.estimated_hours}h
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteTask(subtask.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar tarea"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!currentTask.subtasks || currentTask.subtasks.length === 0) && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FaListUl className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No hay pasos asignados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Progreso</h3>
            <span className="text-sm font-medium text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evidencia Fotográfica</h3>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sección Antes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Antes</h4>
              <div 
                onClick={() => handleImageClick('before')}
                className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden"
              >
                {images.before ? (
                  <img 
                    src={images.before} 
                    alt="Antes" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-gray-500">Agregar foto</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sección Durante */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Durante</h4>
              <div 
                onClick={() => handleImageClick('during')}
                className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden"
              >
                {images.during ? (
                  <img 
                    src={images.during} 
                    alt="Durante" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-gray-500">Agregar foto</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sección Después */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Después</h4>
              <div 
                onClick={() => handleImageClick('after')}
                className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden"
              >
                {images.after ? (
                  <img 
                    src={images.after} 
                    alt="Después" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-gray-500">Agregar foto</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            {uploading ? 'Subiendo imagen...' : 'Haz clic en cada sección para agregar una foto del proceso'}
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => router.push('/admin/tasks')}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Volver
        </button>
        <button
          onClick={handleDeleteAssignment}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Eliminar Asignación
        </button>
        <button
          onClick={handleCompleteTask}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Marcar como completada
        </button>
      </div>
    </div>
  );
} 