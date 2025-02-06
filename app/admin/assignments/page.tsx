'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { User } from '@supabase/supabase-js';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector';
import { toast } from 'react-hot-toast';

interface WorkShiftData {
  id: string;
  shift_type: 'morning' | 'afternoon' | 'night';
  start_time: string;
  end_time: string;
  user_id: string | null;
}

interface Turno {
  id: string;
  nombre: string;
  horario: string;
  personasAsignadas: number;
  enLinea: number;
}

interface Sala {
  id: string;
  nombre: string;
  color: string;
  tareas: {
    id: string;
    titulo: string;
    descripcion: string;
    estado: string;
    prioridad: string;
    fechaCreacion: string;
    fechaVencimiento: string;
  }[];
  areas: {
    id: string;
    name: string;
  }[];
}

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [frecuencia, setFrecuencia] = useState('diario');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState('');
  const [selectedShiftUser, setSelectedShiftUser] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Cargar turnos
      const { data: turnosData } = await supabase
        .from('work_shifts')
        .select(`
          id,
          shift_type,
          start_time,
          end_time,
          user_id
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'scheduled')
        .order('shift_type') as { data: WorkShiftData[] | null };

      if (turnosData) {
        const turnoNombres = {
          'morning': 'Turno A',
          'afternoon': 'Turno B',
          'night': 'Turno C'
        };

        const turnosFormatted: Turno[] = turnosData.map((turno) => ({
          id: turno.id,
          nombre: turnoNombres[turno.shift_type as keyof typeof turnoNombres] || 'Sin nombre',
          horario: `${new Date(turno.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(turno.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          personasAsignadas: turno.user_id ? 1 : 0,
          enLinea: 0
        }));
        setTurnos(turnosFormatted);
      }

      // Cargar usuarios
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active');

      if (usersData) {
        const userList = usersData.map(u => ({
          id: u.id,
          fullName: `${u.first_name} ${u.last_name}`
        }));
        setUsuarios(userList.map(u => u.fullName));
        const newUserMap = userList.reduce((acc, user) => ({
          ...acc,
          [user.fullName]: user.id
        }), {} as Record<string, string>);
        setUserMap(newUserMap);
      }

      // Cargar salas y sus tareas
      const { data: salasData } = await supabase
        .from('salas')
        .select(`
          id,
          nombre,
          areas (
            id,
            name,
            tasks (
              id,
              title,
              description,
              status,
              priority,
              assigned_to,
              created_at,
              due_date
            )
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('estado', true);

      if (salasData) {
        const salasFormatted = salasData.map((sala) => {
          const tareas = sala.areas
            .flatMap(area => area.tasks || [])
            .filter(task => task.status !== 'completed')
            .map(task => ({
              id: task.id,
              titulo: task.title,
              descripcion: task.description || '',
              estado: task.status,
              prioridad: task.priority || 'low',
              fechaCreacion: new Date(task.created_at || new Date()).toLocaleDateString(),
              fechaVencimiento: task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'
            }));

          return {
            id: sala.id,
            nombre: sala.nombre,
            color: getSalaColor(sala.nombre),
            tareas: tareas,
            areas: sala.areas.map(area => ({
              id: area.id,
              name: area.name
            }))
          };
        });

        setSalas(salasFormatted);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getSalaColor = (salaNombre: string): string => {
    const colorMap: { [key: string]: string } = {
      'Bioseguridad': '#FF6B6B',             // Coral rojizo (como en la imagen)
      'Inyección': '#40C4AA',                // Turquesa brillante
      'Cuarto Frío': '#4CB8D4',              // Azul celeste brillante
      'Producción': '#98D8BE',               // Verde menta suave
      'Techos, Paredes y Pisos': '#FFB443',  // Naranja cálido
      'Canaletas y Rejillas': '#90C2E7',     // Azul claro suave
      'Áreas Comunes': '#B784ED',            // Púrpura suave
      'Áreas Verdes': '#7CCCB9',             // Verde agua
      'Estacionamiento': '#FFA07A',          // Salmón claro
      'Oficinas': '#82D4BB',                 // Verde menta
      'Recepción': '#FF8BA7',                // Rosa suave
      'Baños': '#9B6EDC',                    // Púrpura medio
      'Almacén': '#738AE6'                   // Azul medio
    };

    return colorMap[salaNombre] || '#6B7280'; // Color por defecto
  };

  const handleCreateAssignment = async () => {
    console.log('=== INICIO DE CREACIÓN DE ASIGNACIÓN ===');
    try {
      console.log('Iniciando creación de asignación con datos:', {
        selectedUser,
        selectedSala,
        selectedArea,
        selectedDate,
        startTime,
        endTime,
        frecuencia
      });

      // Validación de campos requeridos
      if (!selectedUser || !selectedSala || !selectedArea || !selectedDate || !startTime || !endTime) {
        console.log('Validación fallida - campos faltantes:', {
          selectedUser: !!selectedUser,
          selectedSala: !!selectedSala,
          selectedArea: !!selectedArea,
          selectedDate: !!selectedDate,
          startTime: !!startTime,
          endTime: !!endTime
        });
        toast.error('Por favor complete todos los campos');
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error de autenticación:', authError);
        toast.error('No autorizado');
        return;
      }

      console.log('Usuario autenticado:', user.id);

      // Obtener el perfil del usuario y verificar rol
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error al obtener el perfil:', profileError);
        toast.error('Error al obtener el perfil del usuario');
        return;
      }

      // Verificar si el usuario tiene permisos para crear tareas
      if (!['admin', 'enterprise'].includes(userProfile.role)) {
        console.error('Usuario sin permisos suficientes:', userProfile.role);
        toast.error('No tiene permisos para crear tareas');
        return;
      }

      console.log('Perfil de usuario obtenido:', userProfile);

      const selectedUserId = userMap[selectedUser];
      if (!selectedUserId) {
        console.error('Usuario seleccionado no encontrado en userMap:', {
          selectedUser,
          userMap
        });
        toast.error('Error: Usuario no encontrado');
        return;
      }

      console.log('ID de usuario seleccionado:', selectedUserId);

      // Crear la fecha completa combinando fecha y hora
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      console.log('Fechas procesadas:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });

      if (endDateTime <= startDateTime) {
        console.log('Error: Fecha de fin anterior o igual a fecha de inicio');
        toast.error('La hora de fin debe ser posterior a la hora de inicio');
        return;
      }

      // Obtener información de la sala y área
      const { data: salaData, error: salaError } = await supabase
        .from('salas')
        .select('nombre')
        .eq('id', selectedSala)
        .single();

      if (salaError) {
        console.error('Error al obtener datos de la sala:', salaError);
        toast.error('Error al obtener datos de la sala');
        return;
      }

      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select('name')
        .eq('id', selectedArea)
        .single();

      if (areaError) {
        console.error('Error al obtener datos del área:', areaError);
        toast.error('Error al obtener datos del área');
        return;
      }

      console.log('Datos obtenidos:', {
        sala: salaData,
        area: areaData
      });

      // Crear la tarea con la estructura correcta de la tabla
      const taskData = {
        organization_id: userProfile.organization_id,
        area_id: selectedArea,
        title: `Turno ${startTime} - ${endTime}`,
        description: `Turno asignado para ${salaData?.nombre} (${areaData?.name}) de ${startTime} a ${endTime}`,
        assigned_to: selectedUserId,
        status: 'pending',
        priority: 'medium',
        start_date: startDateTime.toISOString(),
        due_date: endDateTime.toISOString(),
        created_by: user.id,
        sala_id: selectedSala,
        frequency: frecuencia,
        start_time: startTime,
        end_time: endTime
      };

      console.log('Intentando crear tarea con datos:', taskData);

      // Insertar la tarea
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert([taskData])
        .select();

      if (taskError) {
        console.error('Error al crear la tarea:', taskError);
        toast.error(`Error al crear la tarea: ${taskError.message}`);
        return;
      }

      console.log('Tarea creada exitosamente:', newTask);
      toast.success('Asignación creada exitosamente');
      
      // Limpiar el formulario
      setSelectedUser('');
      setSelectedSala(null);
      setSelectedArea('');
      setSelectedDate('');
      setStartTime('');
      setEndTime('');
      setFrecuencia('diario');
      
      // Recargar los datos
      await loadData();

    } catch (error: any) {
      console.error('Error al crear la asignación:', error);
      toast.error(error.message || 'Error al crear la asignación');
    }
  };

  const addUserToShift = async () => {
    try {
      if (!selectedShiftUser || !selectedTurno) {
        toast.error('Selecciona un turno y un usuario');
        return;
      }

      const userId = userMap[selectedShiftUser];
      
      if (!userId) {
        toast.error('Usuario no encontrado');
        return;
      }

      const { error: updateError } = await supabase
        .from('work_shifts')
        .update({ user_id: userId })
        .eq('id', selectedTurno);

      if (updateError) throw updateError;

      toast.success('Usuario asignado al turno correctamente');
      setSelectedTurno('');
      setSelectedShiftUser('');
      setShowAddUserModal(false);
      loadData();
    } catch (error) {
      console.error('Error al asignar usuario al turno:', error);
      toast.error('Error al asignar usuario al turno');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#4263eb] -mx-6 -mt-6 px-6 py-4">
        <h1 className="text-xl font-bold text-white">Gestión de Asignaciones</h1>
        <p className="text-sm text-blue-100">Turnos del personal</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Turnos del Personal */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Turnos del Personal</h2>
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg shadow-sm space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Cargando turnos...</div>
            ) : (
              turnos.map((turno) => (
                <div 
                  key={turno.id}
                  className={`p-6 rounded-lg shadow-sm ${
                    turno.nombre === 'Turno A' ? 'bg-blue-50 border-l-4 border-blue-500' :
                    turno.nombre === 'Turno B' ? 'bg-green-50 border-l-4 border-green-500' :
                    'bg-purple-50 border-l-4 border-purple-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{turno.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-1">{turno.personasAsignadas} personas asignadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-medium">{turno.horario}</p>
                      <p className="text-sm text-gray-500 mt-1">{turno.enLinea} en línea</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="w-full py-3 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors mt-4"
            >
              Agregar Usuario a Turno
            </button>
          </div>
        </div>

        {/* Nueva Asignación */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Nueva Asignación</h2>
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg shadow-sm space-y-4">
            {/* Usuario */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Usuario
              </label>
              <select 
                className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Seleccionar Usuario</option>
                {usuarios.map((usuario) => (
                  <option key={usuario} value={usuario}>{usuario}</option>
                ))}
              </select>
            </div>

            {/* Sala y Área */}
            <SalaAreaSelector
              onSalaChange={(sala) => {
                setSelectedSala(sala?.id || null);
              }}
              onAreaChange={(area) => {
                setSelectedArea(area?.id || '');
              }}
              className="space-y-4"
            />

            {/* Fecha y Hora */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha y Hora
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="time"
                    className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="Hora inicio"
                  />
                </div>
                <span className="text-gray-500">a</span>
                <div className="flex-1">
                  <input
                    type="time"
                    className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="Hora fin"
                  />
                </div>
              </div>
              <input
                type="date"
                className="w-full mt-2 p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Frecuencia */}
            <div className="grid grid-cols-4 gap-2">
              <button
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  frecuencia === 'diario'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
                onClick={() => setFrecuencia('diario')}
              >
                Diario
              </button>
              <button
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  frecuencia === 'semanal'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
                onClick={() => setFrecuencia('semanal')}
              >
                Semanal
              </button>
              <button
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  frecuencia === 'quincenal'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
                onClick={() => setFrecuencia('quincenal')}
              >
                Quincenal
              </button>
              <button
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  frecuencia === 'mensual'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
                onClick={() => setFrecuencia('mensual')}
              >
                Mensual
              </button>
            </div>

            {/* Botón de Crear Asignación */}
            <div className="mt-6">
              <button
                onClick={() => {
                  console.log('Botón Crear Asignación clickeado');
                  handleCreateAssignment();
                }}
                className="w-full py-3 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors"
                type="button"
              >
                Crear Asignación
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tareas por Sala */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Tareas por Sala</h2>
        <div className="grid grid-cols-3 gap-6">
          {salas.map((sala) => (
            <div 
              key={sala.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
              style={{ borderLeft: `4px solid ${sala.color}` }}
            >
              {/* Encabezado de la sala */}
              <div className="p-4" style={{ backgroundColor: `${sala.color}10` }}>
                <h3 className="font-semibold text-gray-800">{sala.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {sala.tareas.length} tareas pendientes
                </p>
              </div>

              {/* Lista de tareas */}
              <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {sala.tareas.length > 0 ? (
                  <div className="space-y-3">
                    {sala.tareas.map((tarea) => (
                      <div 
                        key={tarea.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4"
                        style={{ borderLeftColor: sala.color }}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-800">{tarea.titulo}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tarea.prioridad === 'high' ? 'bg-red-100 text-red-700' :
                            tarea.prioridad === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {tarea.prioridad === 'high' ? 'Alta' :
                             tarea.prioridad === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{tarea.descripcion}</p>
                        <div className="flex items-center justify-between mt-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Creada: {tarea.fechaCreacion}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Vence: {tarea.fechaVencimiento}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-500">Estado: {tarea.estado === 'pending' ? 'Pendiente' : tarea.estado === 'in_progress' ? 'En Progreso' : 'Completada'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No hay tareas pendientes</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para agregar usuario a turno */}
      <Dialog 
        open={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-gradient-to-r from-blue-50 to-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-blue-900 mb-4">
              Agregar Usuario a Turno
            </Dialog.Title>

            <div className="space-y-4">
              {/* Selector de Usuario */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Usuario
                </label>
                <select
                  className="w-full p-2 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedShiftUser}
                  onChange={(e) => setSelectedShiftUser(e.target.value)}
                >
                  <option value="">Seleccionar Usuario</option>
                  {usuarios.map((usuario, index) => (
                    <option key={index} value={usuario}>{usuario}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Turno */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Turno
                </label>
                <select
                  className="w-full p-2 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedTurno}
                  onChange={(e) => setSelectedTurno(e.target.value)}
                >
                  <option value="">Seleccionar Turno</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre} ({turno.horario})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={addUserToShift}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#4263eb] rounded-lg hover:bg-[#364fc7]"
                >
                  Agregar
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 