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
  complexity?: string;
  sort_order?: number;
}

export default function CurrentTaskPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClientComponentClient<Database>());
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [areaTasks, setAreaTasks] = useState<Task[]>([]);
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
          id,
          title,
          description,
          status,
          priority,
          assigned_to,
          due_date,
          created_at,
          start_time,
          end_time,
          area_id,
          sala_id,
          type,
          organization_id,
          assignee:users!tasks_assigned_to_fkey(
            first_name,
            last_name
          ),
          area:areas!inner(
            id,
            name,
            status
          ),
          sala:salas!inner(
            id,
            nombre
          )
        `)
        .eq('assigned_to', user.id)
        .eq('status', 'in_progress')
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

      // Formatear la tarea principal
      const formattedMainTask: Task = {
        ...mainTask,
        assignee: mainTask.assignee?.[0] || undefined,
        area: mainTask.area?.[0],
        sala: mainTask.sala?.[0],
        subtasks: []
      };

      console.log('Tarea principal encontrada:', {
        id: formattedMainTask.id,
        title: formattedMainTask.title,
        status: formattedMainTask.status,
        area_id: formattedMainTask.area_id,
        area: formattedMainTask.area?.name
      });

      // Primero obtenemos el área
      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select(`
          id,
          name,
          tasks (
            id,
            title,
            description,
            status,
            priority,
            estimated_hours,
            created_at,
            organization_id,
            type,
            area_id,
            sala_id,
            assigned_to,
            users!tasks_assigned_to_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('id', mainTask.area_id)
        .single();

      console.log('Debug - Área y sus tareas:', {
        area: areaData?.name,
        totalTasks: areaData?.tasks?.length,
        tasks: areaData?.tasks?.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status
        }))
      });

      if (areaError) {
        console.error('Error al obtener área:', areaError);
        throw new Error('Error al obtener el área y sus tareas');
      }

      if (!areaData || !areaData.tasks) {
        console.log('No se encontraron tareas en el área');
        setCurrentTask(formattedMainTask);
        setLoading(false);
        return;
      }

      // Formatear las tareas del área
      const formattedTasks: Task[] = areaData.tasks
        .filter(task => task.id !== mainTask.id && task.status !== 'cancelled')
        .map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as Task['status'],
          priority: task.priority as Task['priority'] || 'medium',
          assigned_to: task.assigned_to || '',
          created_at: task.created_at,
          due_date: mainTask.due_date, // Usar la fecha de vencimiento de la tarea principal
          area_id: task.area_id,
          organization_id: task.organization_id,
          estimated_hours: task.estimated_hours || 0.5,
          assignee: task.users?.[0] ? {
            first_name: task.users[0].first_name,
            last_name: task.users[0].last_name
          } : undefined
        }));

      setAreaTasks(formattedTasks);
      
      // Actualizar la tarea principal
      setCurrentTask(formattedMainTask);
      setProgress(0);
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!userProfile) throw new Error('Perfil no encontrado')
      if (!currentTask) throw new Error('No hay tarea activa')

      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', { hour12: false })

      // Crear el contenido del reporte en formato estructurado
      const reportContent = {
        title: `Reporte de contingencia - ${currentTask.sala?.nombre || 'Sin sala'}`,
        area: currentTask.area?.name || '',
        sala: currentTask.sala?.nombre || '',
        fecha: now.toLocaleDateString(),
        horaInicio: currentTask.start_time || '',
        horaFin: timeString,
        actividades: currentTask.subtasks?.map((task, index) => {
        const description = task.description.toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return `${index + 1}. ${description}`;
        }) || [],
        imagenes: {
          inicial: images.before || '',
          durante: images.during || '',
          final: images.after || ''
        }
      };

        // Crear el reporte de contingencia
        const contingencyData = {
        title: reportContent.title,
        description: JSON.stringify(reportContent), // Guardamos como JSON para mantener la estructura
          status: 'completed',
          created_by: user.id,
          area_id: currentTask.area_id,
          organization_id: userProfile.organization_id,
          created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      console.log('Creando reporte de contingencia:', {
        title: contingencyData.title,
        hasImages: {
          before: !!images.before,
          during: !!images.during,
          after: !!images.after
        }
      });

        // Insertar el reporte
        const { error: contingencyError } = await supabase
          .from('contingencies')
        .insert([contingencyData]);

      if (contingencyError) {
        console.error('Error al crear el reporte:', contingencyError);
        throw new Error('Error al crear el reporte de contingencia');
      }

        // Actualizar el estado de la tarea
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            end_time: timeString,
            updated_at: now.toISOString()
          })
        .eq('id', currentTask.id);

      if (updateError) {
        console.error('Error al actualizar la tarea:', updateError);
        throw new Error('Error al actualizar el estado de la tarea');
      }

      toast.success('Tarea completada y reporte generado');
      router.push('/admin/tasks');

      } catch (error: any) {
      console.error('Error al completar la tarea:', error);
      toast.error(error.message || 'Error al completar la tarea');
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
      if (!currentTask) {
        toast.error('No hay tarea principal activa');
        return;
      }

      const newStatus = subtask.status === 'completed' ? 'in_progress' : 'completed';
      
      // Actualizar solo el estado local
      const updatedSubtasks = currentTask.subtasks?.map(t => 
        t.id === subtask.id ? { ...t, status: newStatus as Task['status'] } : t
      ) || [];
      
      setCurrentTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: updatedSubtasks
        };
      });
      
      // Actualizar el progreso
      const completed = updatedSubtasks.filter(t => t.status === 'completed').length;
      const total = updatedSubtasks.length;
      setProgress(Math.round((completed / total) * 100));

      toast.success(`Paso ${newStatus === 'completed' ? 'completado' : 'en progreso'}`);
      
    } catch (error: any) {
      console.error('Error al actualizar el estado de la tarea:', error);
      toast.error('Error al actualizar el estado de la tarea');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = fileInputRef.current?.getAttribute('data-type') as 'before' | 'during' | 'after';
    
    console.log('handleFileChange:', { file, type });
    
    if (!file) {
      console.error('No se seleccionó ningún archivo');
      toast.error('Por favor selecciona una imagen');
      return;
    }
    
    if (!type) {
      console.error('No se especificó el tipo de imagen');
      toast.error('Error al procesar la imagen');
      return;
    }
    
    handleImageUpload(type, file);
  };

  const handleImageUpload = async (type: 'before' | 'during' | 'after', file: File) => {
    try {
      console.log('1. Iniciando subida de imagen');
      setUploading(true);
      
      if (!currentTask) {
        throw new Error('No hay tarea seleccionada');
      }

      // Validar el tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WebP)');
      }

      // Nombre de archivo simple
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `tasks/${currentTask.id}/${type}_${Date.now()}.${fileExt}`;

      console.log('2. Subiendo archivo:', fileName);

      // Subir archivo al bucket Attachments
      const { data, error: uploadError } = await supabase.storage
        .from('Attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('3. Error al subir:', uploadError);
        throw uploadError;
      }

      console.log('4. Archivo subido exitosamente');

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('Attachments')
        .getPublicUrl(fileName);

      console.log('5. URL pública generada:', publicUrl);

      // Actualizar estado local
      setImages(prev => {
        const newImages = {
        ...prev,
          [type]: publicUrl
        };
        console.log('6. Estado de imágenes actualizado:', newImages);
        return newImages;
      });

      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      console.error('Error:', error);
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
    <>
      <div className="container mx-auto px-4 py-8">
        <div style={{ backgroundColor: '#ffffff' }} className="rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 style={{ color: '#1f2937' }} className="text-3xl font-bold">
              Tareas {currentTask?.sala?.nombre || ''}
            </h1>
            <div className="flex items-center space-x-4">
              <span style={{ color: '#4b5563' }}>
                <FaClock className="inline mr-2" />
                {elapsedTime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 style={{ color: '#1f2937' }} className="text-xl font-semibold mb-4">Detalles de la Asignación</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaBuilding style={{ color: '#6b7280' }} className="mt-1 mr-3" />
                  <div>
                    <p style={{ color: '#374151' }} className="font-medium">Ubicación</p>
                    <p style={{ color: '#4b5563' }}>{currentTask.sala?.nombre || 'No especificado'} - {currentTask.area?.name || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaUserCircle style={{ color: '#6b7280' }} className="mt-1 mr-3" />
                  <div>
                    <p style={{ color: '#374151' }} className="font-medium">Asignado a</p>
                    <p style={{ color: '#4b5563' }}>
                      {currentTask.assignee 
                        ? `${currentTask.assignee.first_name} ${currentTask.assignee.last_name}`
                        : 'No asignado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaHourglassHalf style={{ color: '#6b7280' }} className="mt-1 mr-3" />
                  <div>
                    <p style={{ color: '#374151' }} className="font-medium">Horario</p>
                    <p style={{ color: '#4b5563' }}>
                      {currentTask.start_time || ''} - {currentTask.end_time || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ color: '#1f2937' }} className="text-xl font-semibold mb-4">Tareas del Área</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {areaTasks && areaTasks.length > 0 ? (
                  areaTasks.map((task, index) => (
                    <div 
                      key={task.id} 
                      className={`flex items-start space-x-2 p-4 rounded-lg border ${
                        task.status === 'completed' 
                          ? 'bg-green-50 border-green-200' 
                          : task.status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200'
                      } shadow-sm hover:shadow-md transition-all duration-200`}
                    >
                      <div 
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className={`font-medium text-base ${
                              task.status === 'completed'
                                ? 'text-green-700'
                                : task.status === 'in_progress'
                                ? 'text-blue-700'
                                : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              {task.assignee && (
                                <span className="flex items-center text-gray-600">
                                  <FaUserCircle className="mr-1" />
                                  {task.assignee.first_name} {task.assignee.last_name}
                                </span>
                              )}
                              {task.estimated_hours && (
                                <span className="flex items-center text-gray-600">
                                  <FaClock className="mr-1" />
                                  {task.estimated_hours}h
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : task.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {task.status === 'completed' 
                                  ? 'Completada' 
                                  : task.status === 'in_progress'
                                  ? 'En progreso'
                                  : 'Pendiente'}
                              </span>
                              {task.priority && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  task.priority === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {task.priority === 'high' 
                                    ? 'Alta' 
                                    : task.priority === 'medium'
                                    ? 'Media'
                                    : 'Baja'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                      <FaListUl className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No hay tareas disponibles para esta área</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ color: '#1f2937' }} className="text-lg font-semibold">Progreso</h3>
              <span style={{ color: '#4b5563' }} className="text-sm font-medium">{progress}%</span>
            </div>
            <div style={{ backgroundColor: '#e5e7eb' }} className="w-full rounded-full h-2.5">
              <div
                style={{ backgroundColor: '#2563eb', width: `${progress}%` }}
                className="h-2.5 rounded-full transition-all duration-500"
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 style={{ color: '#1f2937' }} className="text-lg font-semibold mb-4">Evidencia Fotográfica</h3>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sección Antes */}
              <div style={{ backgroundColor: '#f9fafb' }} className="rounded-lg p-4">
                <h4 style={{ color: '#374151' }} className="font-medium mb-3">Antes</h4>
                <div 
                  onClick={() => handleImageClick('before')}
                  style={{ backgroundColor: '#f3f4f6' }}
                  className="aspect-video rounded-lg relative overflow-hidden cursor-pointer"
                >
                  {images.before ? (
                    <div className="relative w-full h-full">
                    <img 
                      src={images.before} 
                      alt="Antes" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error al cargar la imagen:', e);
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ borderColor: '#d1d5db' }} className="flex flex-col items-center justify-center h-full border-2 border-dashed">
                      <svg style={{ color: '#9ca3af' }} className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span style={{ color: '#6b7280' }} className="text-sm">Agregar foto</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección Durante */}
              <div style={{ backgroundColor: '#f9fafb' }} className="rounded-lg p-4">
                <h4 style={{ color: '#374151' }} className="font-medium mb-3">Durante</h4>
                <div 
                  onClick={() => handleImageClick('during')}
                  style={{ backgroundColor: '#f3f4f6' }}
                  className="aspect-video rounded-lg relative overflow-hidden cursor-pointer"
                >
                  {images.during ? (
                    <div className="relative w-full h-full">
                    <img 
                      src={images.during} 
                      alt="Durante" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error al cargar la imagen:', e);
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ borderColor: '#d1d5db' }} className="flex flex-col items-center justify-center h-full border-2 border-dashed">
                      <svg style={{ color: '#9ca3af' }} className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span style={{ color: '#6b7280' }} className="text-sm">Agregar foto</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección Después */}
              <div style={{ backgroundColor: '#f9fafb' }} className="rounded-lg p-4">
                <h4 style={{ color: '#374151' }} className="font-medium mb-3">Después</h4>
                <div 
                  onClick={() => handleImageClick('after')}
                  style={{ backgroundColor: '#f3f4f6' }}
                  className="aspect-video rounded-lg relative overflow-hidden cursor-pointer"
                >
                  {images.after ? (
                    <div className="relative w-full h-full">
                    <img 
                      src={images.after} 
                      alt="Después" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error al cargar la imagen:', e);
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ borderColor: '#d1d5db' }} className="flex flex-col items-center justify-center h-full border-2 border-dashed">
                      <svg style={{ color: '#9ca3af' }} className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span style={{ color: '#6b7280' }} className="text-sm">Agregar foto</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p style={{ color: '#6b7280' }} className="text-sm mt-2 text-center">
              {uploading ? 'Subiendo imagen...' : 'Haz clic en cada sección para agregar una foto del proceso'}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => router.push('/admin/tasks')}
            style={{ borderColor: '#d1d5db', color: '#374151' }}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={handleDeleteAssignment}
            style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
            className="px-6 py-2 rounded-lg transition-colors"
          >
            Eliminar Asignación
          </button>
          <button
            onClick={handleCompleteTask}
            style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
            className="px-6 py-2 rounded-lg transition-colors"
          >
            Marcar como completada
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
      `}</style>
    </>
  );
} 