'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string;
  department: string;
  work_shift: string;
  status: string;
  hire_date: string;
  role: string;
  email: string;
  contact_info: {
    email: string;
    phone: string;
  };
}

interface Assignment {
  user: string;
  task: string;
  area: string;
  shift: string;
}

export default function RRHHPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    shiftsToday: 0
  });

  // Estados para filtros
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTurnosModal, setShowTurnosModal] = useState(false);

  // Estados para asignaciones
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const supabase = createClientComponentClient();

  // Cargar empleados
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userData } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();

      if (!userData) throw new Error('Usuario no encontrado');

      let query = supabase
        .from('users')
        .select(`
          *,
          organization:organizations(name)
        `)
        .neq('role', 'superadmin') // No mostrar superadmins en la lista

      // Si no es superadmin, filtrar por organization_id
      if (userData.role !== 'superadmin') {
        if (!userData.organization_id) {
          throw new Error('Usuario no tiene organización asignada')
        }
        query = query.eq('organization_id', userData.organization_id)
      }

      const { data: employeesData, error: employeesError } = await query;

      if (employeesError) throw employeesError;

      setEmployees(employeesData || []);
      
      // Actualizar estadísticas
      setStats({
        totalEmployees: employeesData?.length || 0,
        activeEmployees: employeesData?.filter(e => e.status === 'active').length || 0,
        shiftsToday: employeesData?.filter(e => e.work_shift === 'morning').length || 0
      });

    } catch (error) {
      console.error('Error loading employees:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar empleados');
      toast.error('Error al cargar empleados');
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones de manejo de empleados
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setEmployees(employees.filter(emp => emp.id !== id));
        toast.success('Usuario eliminado exitosamente');
        
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  // Modal de Agregar Empleado
  const AddEmployeeModal = () => {
    const [newEmployee, setNewEmployee] = useState({
      nombre: '',
      apellido: '',
      rol: '',
      ubicacion: '',
      username: '',
      password: '',
      confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newEmployee.password !== newEmployee.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No se encontró usuario autenticado');

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!userData?.organization_id) throw new Error('No se encontró organización');

        const { data: employee, error } = await supabase
          .from('employees')
          .insert([{
            organization_id: userData.organization_id,
            first_name: newEmployee.nombre,
            last_name: newEmployee.apellido,
            position: newEmployee.rol,
            department: newEmployee.ubicacion,
            work_shift: '',
            status: 'active',
            hire_date: new Date().toISOString().split('T')[0],
            role: newEmployee.rol,
            contact_info: {
              email: `${newEmployee.username}@hospital.com`,
              phone: ''
            }
          }])
          .select()
          .single();

        if (error) throw error;

        setEmployees([...employees, employee]);
        setShowAddModal(false);
        toast.success('Usuario creado exitosamente');

        // Si es usuario regular, agregarlo al estado de turnos
        if (employee.role === 'usuario') {
          const newAssignment = {
            user: `${employee.first_name} ${employee.last_name}`,
            task: "",
            area: employee.department,
            shift: ""
          };
          setAssignments(prev => [...prev, newAssignment]);
        }

      } catch (error) {
        console.error('Error creating employee:', error);
        toast.error('Error al crear usuario');
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-8 border w-[600px] shadow-lg rounded-xl bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Crear Nuevo Usuario</h3>
            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newEmployee.nombre}
                  onChange={(e) => setNewEmployee({...newEmployee, nombre: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newEmployee.apellido}
                  onChange={(e) => setNewEmployee({...newEmployee, apellido: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newEmployee.rol}
                  onChange={(e) => setNewEmployee({...newEmployee, rol: e.target.value})}
                  required
                >
                  <option value="">Seleccionar rol</option>
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                  <option value="admin_principal">Administrador Principal</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ubicación
                </label>
                <select
                  value={newEmployee.ubicacion}
                  onChange={(e) => setNewEmployee({ ...newEmployee, ubicacion: e.target.value })}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar ubicación</option>
                  <option value="Limpieza General">Limpieza General</option>
                  <option value="Almacén">Almacén</option>
                  <option value="Área de Inyección">Área de Inyección</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Control de Calidad">Control de Calidad</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newEmployee.username}
                  onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newEmployee.confirmPassword}
                  onChange={(e) => setNewEmployee({...newEmployee, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadEmployees}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con gradiente y sombra suave */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-sm p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Recursos Humanos</h1>
            <p className="text-blue-100 mt-1">Gestión de personal y turnos</p>
          </div>
        </div>
      </div>

      {/* Cards de estadísticas con diseño mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Total Personal</h2>
                <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Crear Usuario</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Turnos Activos</h2>
                <p className="text-3xl font-bold text-green-600">{stats.shiftsToday}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowTurnosModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Gestionar Turnos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de empleados */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Personal Regular</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
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
              {employees
                .filter(emp => emp.role === 'usuario')
                .map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {(employee.first_name || employee.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.first_name && employee.last_name 
                              ? `${employee.first_name} ${employee.last_name}`
                              : employee.email || 'Usuario sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">ID: {employee.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de administradores */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Administradores y Enterprise</h2>
        </div>
        <div className="p-6 space-y-4">
          {employees
            .filter(emp => emp.role === 'admin' || emp.role === 'enterprise' || emp.role === 'admin_principal')
            .map(employee => (
              <div key={employee.id} className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-cyan-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {(employee.first_name || employee.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.first_name && employee.last_name 
                          ? `${employee.first_name} ${employee.last_name}`
                          : employee.email || 'Usuario sin nombre'}
                      </div>
                      <div className="text-sm text-cyan-600">
                        {employee.position}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {employee.id}
                      </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="text-cyan-600 hover:text-cyan-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modales */}
      {showAddModal && <AddEmployeeModal />}
    </div>
  );
}
