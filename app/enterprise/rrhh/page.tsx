'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  area: string;
  status: 'active' | 'inactive';
}

interface SpecialUser {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'enterprise';
  status: 'active' | 'inactive';
}

export default function RRHHPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [totalPersonal, setTotalPersonal] = useState(0);
  const [turnosActivos, setTurnosActivos] = useState(0);
  const [personal, setPersonal] = useState<Employee[]>([]);
  const [usuariosEspeciales, setUsuariosEspeciales] = useState<SpecialUser[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener personal regular
      const { data: personalData, error: personalError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee');
      
      if (personalError) {
        console.error('Error fetching users:', personalError);
        setPersonal([]);
      } else {
        setPersonal(personalData || []);
        setTotalPersonal(personalData?.length || 0);
      }

      // Obtener usuarios especiales (admin y enterprise)
      const { data: especialesData, error: especialesError } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admin', 'enterprise']);
      
      if (especialesError) {
        console.error('Error fetching special users:', especialesError);
        setUsuariosEspeciales([]);
      } else {
        setUsuariosEspeciales(especialesData || []);
      }

      // Obtener turnos activos
      const { data: turnosData, error: turnosError } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('status', 'active');
      
      if (turnosError) {
        console.error('Error fetching shifts:', turnosError);
        setTurnosActivos(0);
      } else {
        setTurnosActivos(turnosData?.length || 0);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error general:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6">Cargando...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 p-6">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Recursos Humanos</h1>
          <p className="mt-2">Gestión de personal y turnos</p>
          
          <div className="mt-6 flex gap-4">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg border border-blue-500"
            >
              <option value="">Todos los departamentos</option>
              {/* Opciones de departamentos */}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg border border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800">Total Personal</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalPersonal}</p>
            <button className="mt-4 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
              Crear Usuario
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800">Turnos Activos</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{turnosActivos}</p>
            <button className="mt-4 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
              Gestionar Turnos
            </button>
          </div>
        </div>

        {/* Personal Registrado */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Personal Registrado</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {personal.map((empleado) => (
                  <tr key={empleado.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {empleado.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {empleado.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empleado.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empleado.area}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        empleado.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {empleado.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                      <button className="ml-4 text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usuarios Especiales */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Usuarios Especiales</h2>
            <p className="text-sm text-gray-500 mt-1">Administradores y Enterprise</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosEspeciales.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {usuario.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                      <button className="ml-4 text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 