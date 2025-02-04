'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { User } from '@supabase/supabase-js';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  organization_id: string;
}

interface Turno {
  id: string;
  nombre: string;
  horario: string;
  personasAsignadas: number;
  enLinea: number;
}

interface Tarea {
  id: string;
  titulo: string;
  asignadoA: string;
  inicio: string;
  finalizacion: string;
  estado: 'completada' | 'en_progreso' | 'no_iniciada';
}

interface Area {
  id: string;
  name: string;
  tasks: {
    id: string;
    title: string;
    status: string;
    assigned_to: string | null;
    created_at: string | null;
    due_date: string | null;
  }[];
}

interface WorkShiftData {
  id: string;
  area: {
    name: string;
  };
  start_time: string;
  end_time: string;
  user_id: string | null;
  sala_id: string | null;
}

interface TaskData {
  id: string;
  title: string;
  status: 'completada' | 'en_progreso' | 'no_iniciada';
  start_time: string | null;
  end_time: string | null;
  assigned_user: {
    first_name: string;
    last_name: string;
  };
}

interface AreaData {
  id: string;
  name: string;
  tasks: {
    id: string;
    title: string;
    status: string;
    assigned_to: string | null;
    created_at: string | null;
    due_date: string | null;
  }[];
}

interface UserData {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
}

interface SupabaseUser extends User {
  organization_id: string;
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [areasDisponibles, setAreasDisponibles] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [frecuencia, setFrecuencia] = useState('diario');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState('');
  const [selectedShiftUser, setSelectedShiftUser] = useState('');
  const [salas, setSalas] = useState<Sala[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      // Obtener perfil del usuario con organization_id
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
          area:areas!inner(name),
          start_time,
          end_time,
          user_id,
          sala_id
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'scheduled') as { data: WorkShiftData[] | null };

      if (turnosData) {
        const turnosFormatted: Turno[] = turnosData.map((turno) => ({
          id: turno.id,
          nombre: turno.area.name || 'Sin nombre',
          horario: `${new Date(turno.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(turno.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          personasAsignadas: turno.user_id ? 1 : 0,
          enLinea: 0 // Este valor se podría actualizar con un sistema de presencia en tiempo real
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
        // Almacenar el ID junto con el nombre completo para referencia posterior
        const userList = usersData.map(u => ({
          id: u.id,
          fullName: `${u.first_name} ${u.last_name}`
        }));
        setUsuarios(userList.map(u => u.fullName));
        // Guardar el mapeo de nombre completo a ID
        const newUserMap = userList.reduce((acc, user) => ({
          ...acc,
          [user.fullName]: user.id
        }), {} as Record<string, string>);
        setUserMap(newUserMap);
      }

      // Cargar salas y sus tareas
      const { data: salasData, error: salasError } = await supabase
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

      console.log('Datos de salas cargados:', salasData);
      console.log('Error al cargar salas:', salasError);

      if (salasError) {
        throw salasError;
      }

      if (salasData) {
        const salasFormatted = salasData.map((sala) => {
          // Obtener todas las tareas de todas las áreas de la sala
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

          const salaFormateada = {
            id: sala.id,
            nombre: sala.nombre,
            color: getSalaColor(sala.nombre),
            tareas: tareas,
            areas: sala.areas.map(area => ({
              id: area.id,
              name: area.name
            }))
          };

          console.log('Sala formateada:', salaFormateada);
          return salaFormateada;
        });

        console.log('Salas formateadas:', salasFormatted);
        setSalas(salasFormatted);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para asignar colores a las salas
  const getSalaColor = (salaNombre: string): string => {
    const colorMap: { [key: string]: string } = {
      'Bioseguridad': '#FF6B6B',     // Color rojo/coral
      'Inyección': '#4FD1C5',        // Color turquesa
      'Cuarto Frío': '#63B3ED',      // Color azul claro
      'Producción': '#68D391',
      'Techos, Paredes y Pisos': '#F6AD55',
      'Canaletas y Rejillas': '#4299E1',
      'Áreas Comunes': '#9F7AEA',
      'Áreas Verdes': '#ED64A6',
      'Estacionamiento': '#F687B3',
      'Oficinas': '#48BB78',
      'Recepción': '#38B2AC',
      'Baños': '#4C51BF',
      'Almacén': '#667EEA'
    };

    return colorMap[salaNombre] || '#6B7280'; // Color gris por defecto si no se encuentra el nombre
  };

  const addUserToShift = async () => {
    try {
      if (!selectedShiftUser || !selectedTurno) {
        alert('Por favor seleccione un usuario y un turno');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener el perfil del usuario con organization_id
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) {
        throw new Error('Usuario no encontrado');
      }

      // Obtener el ID del usuario seleccionado
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', userProfile.organization_id)
        .eq('first_name || \' \' || last_name', selectedShiftUser)
        .single();

      if (!userData) {
        throw new Error('Usuario no encontrado');
      }

      // Insertar en la tabla shift_users
      const { error } = await supabase
        .from('shift_users')
        .insert({
          user_id: userData.id,
          shift_id: selectedTurno,
          status: 'active'
        });

      if (error) throw error;

      // Recargar datos y cerrar modal
      await loadData();
      setShowAddUserModal(false);
      setSelectedTurno('');
      setSelectedShiftUser('');

    } catch (error) {
      console.error('Error adding user to shift:', error);
      alert('Error al agregar usuario al turno');
    }
  };

  const handleCreateAssignment = async () => {
    try {
      console.log('Estado del formulario:', {
        selectedUser,
        selectedSala,
        selectedArea,
        selectedDate,
        selectedEndDate,
        userMap
      });

      if (!selectedUser || !selectedSala || !selectedArea || !selectedDate || !selectedEndDate) {
        toast.error('Por favor complete todos los campos');
        return;
      }

      // Validar que la fecha de finalización sea posterior a la fecha de inicio
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedEndDate);
      
      if (endDate <= startDate) {
        toast.error('La fecha de finalización debe ser posterior a la fecha de inicio');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Obtener el ID del usuario seleccionado del mapa
      const selectedUserId = userMap[selectedUser];
      console.log('ID del usuario seleccionado:', {
        selectedUser,
        selectedUserId,
        userMapKeys: Object.keys(userMap)
      });

      if (!selectedUserId) {
        throw new Error('Usuario no encontrado. Por favor, verifique la selección.');
      }

      const workShiftData = {
        organization_id: userProfile.organization_id,
        user_id: selectedUserId,
        sala_id: selectedSala,
        area_id: selectedArea,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'scheduled'
      };

      console.log('Datos a insertar:', workShiftData);

      const { data: insertedData, error: insertError } = await supabase
        .from('work_shifts')
        .insert([workShiftData])
        .select();

      if (insertError) {
        console.error('Error de inserción:', insertError);
        throw insertError;
      }

      console.log('Datos insertados:', insertedData);

      toast.success('Asignación creada exitosamente');

      // Limpiar el formulario
      setSelectedUser('');
      setSelectedSala(null);
      setSelectedArea('');
      setSelectedDate('');
      setSelectedEndDate('');

      // Recargar los datos
      await loadData();

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Error al crear la asignación: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      if (!window.confirm('¿Está seguro que desea eliminar este turno?')) {
        return;
      }

      const { error } = await supabase
        .from('work_shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      toast.success('Turno eliminado exitosamente');
      loadData(); // Recargar los turnos
    } catch (error) {
      console.error('Error al eliminar turno:', error);
      toast.error('Error al eliminar el turno');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#4263eb] -mx-6 -mt-6 px-6 py-4">
        <h1 className="text-xl font-bold text-white">Gestión de Asignaciones</h1>
        <p className="text-sm text-blue-100">Administra los turnos y tareas del personal</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Turnos del Personal */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Turnos del Personal</h2>
          <div className="space-y-4">
            {turnos.map((turno) => (
              <div 
                key={turno.id}
                className={`p-4 rounded-lg ${
                  turno.nombre === 'Turno A' ? 'bg-blue-50' :
                  turno.nombre === 'Turno B' ? 'bg-green-50' :
                  'bg-purple-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{turno.nombre}</h3>
                    <p className="text-sm text-gray-500">{turno.personasAsignadas} personas asignadas</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{turno.horario}</p>
                      <p className="text-sm text-gray-500">{turno.enLinea} en línea</p>
                    </div>
                    <button
                      onClick={() => handleDeleteShift(turno.id)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar turno"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="w-full py-3 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors"
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
                onChange={(e) => {
                  console.log('Usuario seleccionado:', e.target.value);
                  setSelectedUser(e.target.value);
                }}
              >
                <option value="">Seleccionar Usuario</option>
                {usuarios.map((usuario, index) => (
                  <option key={usuario} value={usuario}>{usuario}</option>
                ))}
              </select>
            </div>

            {/* Sala y Área */}
            <SalaAreaSelector
              onSalaChange={(sala) => {
                setSelectedSala(sala?.id || null);
                console.log('Sala seleccionada:', sala);
              }}
              onAreaChange={(area) => {
                setSelectedArea(area?.id || '');
                console.log('Área seleccionada:', area);
              }}
              className="space-y-4"
            />

            {/* Fecha de Asignación */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha y Hora de Inicio
              </label>
              <input
                type="datetime-local"
                className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Fecha de Finalización */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha y Hora de Finalización
              </label>
              <input
                type="datetime-local"
                className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={selectedEndDate}
                onChange={(e) => setSelectedEndDate(e.target.value)}
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
                onClick={handleCreateAssignment}
                className="w-full py-3 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors"
                disabled={!selectedUser || !selectedSala || !selectedArea || !selectedDate || !selectedEndDate}
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
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <h4 className="font-medium text-gray-800">{tarea.titulo}</h4>
                        <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tarea.prioridad === 'high' ? 'bg-red-100 text-red-700' :
                            tarea.prioridad === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {tarea.prioridad === 'high' ? 'Alta' :
                             tarea.prioridad === 'medium' ? 'Media' : 'Baja'}
                          </span>
                          <span>Vence: {tarea.fechaVencimiento}</span>
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