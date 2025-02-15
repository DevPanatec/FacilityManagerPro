"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import UserSelect from './UserSelect';
import AreaSelect from './AreaSelect';
import DateSelect from './DateSelect';
import DurationButtons from './DurationButtons';

export default function AssignmentClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);

  // Estado para el formulario de nueva asignación
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el usuario actual y su organización
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Usuario no encontrado');
      setOrganizationId(userProfile.organization_id);

      // Cargar usuarios de la organización
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Cargar áreas de la organización
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('id, name')
        .eq('organization_id', userProfile.organization_id);

      if (areasError) throw areasError;
      setAreas(areasData || []);

      // Cargar asignaciones con relaciones
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          users!user_id (
            id,
            first_name,
            last_name
          ),
          areas!area_id (
            id,
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!selectedUser || !selectedArea || !selectedDate) {
        toast.error('Por favor complete todos los campos');
        return;
      }

      const newAssignment = {
        organization_id: organizationId,
        user_id: selectedUser,
        area_id: selectedArea,
        start_time: selectedDate.toISOString(),
        status: 'pending'
      };

      const { error: insertError } = await supabase
        .from('assignments')
        .insert([newAssignment]);

      if (insertError) throw insertError;

      toast.success('Asignación creada exitosamente');

      // Limpiar el formulario
      setSelectedUser('');
      setSelectedArea('');
      setSelectedDate(new Date());

      // Recargar los datos
      await loadData();

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Error al crear la asignación');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;

      toast.success('Asignación eliminada exitosamente');
      await loadData();

    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Error al eliminar la asignación');
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
          onClick={loadData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
                </button>
    </div>
  );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
        <div className="text-white">
          <h1 className="text-3xl font-bold">Asignaciones</h1>
          <p className="text-blue-100 mt-1">Gestión de asignaciones de personal</p>
        </div>
      </div>

      {/* Formulario de nueva asignación */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Nueva Asignación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UserSelect 
            users={users}
            value={selectedUser}
            onChange={setSelectedUser}
          />
          <AreaSelect 
            areas={areas}
            value={selectedArea}
            onChange={setSelectedArea}
          />
          <DateSelect 
            date={selectedDate}
            onChange={setSelectedDate}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCreateAssignment}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Crear Asignación
          </button>
        </div>
      </div>

      {/* Lista de asignaciones */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Asignaciones Actuales</h2>
        </div>
        <div className="p-6">
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay asignaciones creadas
      </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {assignment.users?.first_name} {assignment.users?.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {assignment.areas?.name}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-medium" 
                        style={{
                          backgroundColor: 
                            assignment.status === 'pending' ? '#FEF3C7' :
                            assignment.status === 'in_progress' ? '#DBEAFE' :
                            assignment.status === 'completed' ? '#D1FAE5' : '#F3F4F6',
                          color:
                            assignment.status === 'pending' ? '#92400E' :
                            assignment.status === 'in_progress' ? '#1E40AF' :
                            assignment.status === 'completed' ? '#065F46' : '#374151'
                        }}
                      >
                        {assignment.status === 'pending' ? 'Pendiente' :
                         assignment.status === 'in_progress' ? 'En Progreso' :
                         assignment.status === 'completed' ? 'Completado' : 'Desconocido'}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Inicio: {new Date(assignment.start_time).toLocaleString()}</span>
                    </div>
                  </div>
                <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
