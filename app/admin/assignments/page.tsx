'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { User } from '@supabase/supabase-js';
import SalaAreaSelector from '@/app/shared/componentes/SalaAreaSelector'
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
  nombre: string;
  color: string;
  tareas: Tarea[];
  progreso: {
    completadas: number;
    total: number;
  };
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
  const [frecuencia, setFrecuencia] = useState('diario');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState('');
  const [selectedShiftUser, setSelectedShiftUser] = useState('');

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
        setUsuarios(usersData.map(u => `${u.first_name} ${u.last_name}`));
      }

      // Cargar áreas y sus tareas
      const { data: areasData } = await supabase
        .from('areas')
        .select(`
          id,
          name,
          tasks (
            id,
            title,
            status,
            assigned_to,
            created_at,
            due_date
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active') as { data: AreaData[] | null };

      if (areasData) {
        const areasFormatted = await Promise.all(areasData.map(async (area) => {
          const userIds = area.tasks.map(task => task.assigned_to).filter(Boolean);
          const { data: usersData } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', userIds);

          const userMap = (usersData || []).reduce((acc, user) => ({
            ...acc,
            [user.id]: `${user.first_name} ${user.last_name}`
          }), {} as Record<string, string>);

          const tareas: Tarea[] = area.tasks.map((task) => ({
            id: task.id,
            titulo: task.title,
            asignadoA: task.assigned_to ? userMap[task.assigned_to] : 'Sin asignar',
            inicio: task.created_at ? new Date(task.created_at).toLocaleString() : 'No iniciada',
            finalizacion: task.due_date ? new Date(task.due_date).toLocaleString() : 'En progreso',
            estado: task.status === 'completed' ? 'completada' : 
                   task.status === 'in_progress' ? 'en_progreso' : 'no_iniciada'
          }));

          const areaFormatted: Area = {
            nombre: area.name,
            color: getAreaColor(area.name),
            tareas,
            progreso: {
              completadas: tareas.filter(t => t.estado === 'completada').length,
              total: tareas.length
            }
          };

          return areaFormatted;
        }));

        setAreas(areasFormatted);
        setAreasDisponibles(areasData.map(a => a.name));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para asignar colores a las áreas
  const getAreaColor = (areaName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Bioseguridad': '#FF6B6B',
      'Inyección': '#4FD1C5',
      'Cuarto Frío': '#63B3ED',
      'Producción': '#68D391',
      'Techos, Paredes y Pisos': '#F6AD55',
      'Canaletas y Rejillas': '#4299E1'
    };

    return colorMap[areaName] || '#6B7280';
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
      if (!selectedUser || !selectedSala || !selectedArea || !selectedDate) {
        toast.error('Por favor complete todos los campos');
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

      // Obtener el ID del usuario seleccionado
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', userProfile.organization_id)
        .eq('first_name || \' \' || last_name', selectedUser)
        .single();

      if (!userData) throw new Error('Usuario no encontrado');

      const assignmentData = {
        organization_id: userProfile.organization_id,
        user_id: userData.id,
        sala_id: selectedSala,
        area_id: selectedArea,
        start_time: new Date(selectedDate).toISOString(),
        status: 'scheduled'
      };

      const { error: insertError } = await supabase
        .from('work_shifts')
        .insert([assignmentData]);

      if (insertError) throw insertError;

      toast.success('Asignación creada exitosamente');

      // Limpiar el formulario
      setSelectedUser('');
      setSelectedSala(null);
      setSelectedArea('');
      setSelectedDate('');

      // Recargar los datos
      await loadData();

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Error al crear la asignación');
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
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Seleccionar Usuario</option>
                {usuarios.map((usuario, index) => (
                  <option key={index} value={usuario}>{usuario}</option>
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
                Fecha de Asignación
              </label>
              <input
                type="datetime-local"
                className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                onClick={handleCreateAssignment}
                className="w-full py-3 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors"
                disabled={!selectedUser || !selectedSala || !selectedArea || !selectedDate}
              >
                Crear Asignación
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tareas por Área */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Tareas por Área</h2>
        <div className="grid grid-cols-3 gap-6">
          {areas.map((area, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg overflow-hidden"
              style={{ borderLeft: `4px solid ${area.color}` }}
            >
              {/* Encabezado del área */}
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium" style={{ color: area.color }}>{area.nombre}</h3>
                  <span className="text-sm" style={{ color: area.color }}>{area.tareas.length} tareas</span>
                </div>
              </div>

              {/* Lista de tareas */}
              <div className="px-4 space-y-3 max-h-[300px] overflow-y-auto">
                {area.tareas.map((tarea) => (
                  <div 
                    key={tarea.id} 
                    className="rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
                    style={{ 
                      background: `linear-gradient(to right, ${area.color}15, white)`,
                      borderLeft: `4px solid ${area.color}`
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-base" style={{ color: area.color }}>{tarea.titulo}</h4>
                      <button className="hover:text-red-500 transition-colors" style={{ color: `${area.color}88` }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <p className="text-sm font-medium" style={{ color: area.color }}>
                        {tarea.asignadoA}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-xs" style={{ color: `${area.color}88` }}>
                        <svg className="w-4 h-4 mr-2" style={{ color: area.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium mr-1" style={{ color: area.color }}>Inicio:</span>
                        <span style={{ color: `${area.color}dd` }}>{tarea.inicio}</span>
                      </div>
                      <div className="flex items-center text-xs" style={{ color: `${area.color}88` }}>
                        <svg className="w-4 h-4 mr-2" style={{ color: area.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium mr-1" style={{ color: area.color }}>Finalización:</span>
                        <span style={{ color: `${area.color}dd` }}>{tarea.finalizacion}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${area.color}25` }}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium" style={{ color: area.color }}>Estado</span>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${area.color}15`,
                            color: area.color
                          }}
                        >
                          {tarea.estado === 'completada' ? 'Completada' :
                           tarea.estado === 'en_progreso' ? 'En Progreso' :
                           'No Iniciada'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Barra de progreso */}
              <div className="px-4 py-4" style={{ backgroundColor: `${area.color}05`, borderTop: `1px solid ${area.color}15` }}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium" style={{ color: area.color }}>Progreso Total</span>
                  <span className="font-medium" style={{ color: `${area.color}dd` }}>{area.progreso.completadas}/{area.progreso.total}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: `${area.color}15` }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(area.progreso.completadas / area.progreso.total) * 100}%`,
                      background: `linear-gradient(to right, ${area.color}88, ${area.color})`
                    }}
                  />
                </div>
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