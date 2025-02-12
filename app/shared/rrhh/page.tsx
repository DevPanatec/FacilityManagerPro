'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'

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

interface WorkShift {
  id: string;
  area_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
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
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [areas, setAreas] = useState<{id: string, name: string}[]>([]);

  // Estados para asignaciones
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [selectedSala, setSelectedSala] = useState<string | null>(null);

  // Agregar estados para gestión de turnos
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');

  // Definir los turnos disponibles
  const TURNOS = [
    { id: 'mañana', nombre: 'Mañana', inicio: '06:00', fin: '14:00' },
    { id: 'tarde', nombre: 'Tarde', inicio: '14:00', fin: '22:00' },
    { id: 'noche', nombre: 'Noche', inicio: '22:00', fin: '06:00' }
  ];

  const supabase = createClientComponentClient();

  // Cargar empleados
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Error de autenticación: ${authError.message}`);
      if (!user) throw new Error('No autorizado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();

      if (userError) throw new Error(`Error al obtener datos del usuario: ${userError.message}`);
      if (!userData) throw new Error('Usuario no encontrado');
      if (!userData.organization_id) throw new Error('Usuario no tiene organización asignada');

      // Consulta simplificada que solo obtiene usuarios de la misma organización
      const { data: employeesData, error: employeesError } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', userData.organization_id);

      if (employeesError) {
        console.error('Error detallado:', {
          message: employeesError.message,
          code: employeesError.code,
          details: employeesError.details,
          hint: employeesError.hint
        });
        throw new Error(`Error al cargar empleados: ${employeesError.message}`);
      }

      // Filtrar superadmins después de obtener los datos
      const filteredEmployees = (employeesData || []).filter(emp => emp.role !== 'superadmin');

      const formattedEmployees = filteredEmployees.map(emp => ({
        ...emp,
        position: 'Usuario',
        department: 'General',
        work_shift: 'morning',
        hire_date: emp.created_at,
        contact_info: {
          email: emp.email,
          phone: ''
        }
      }));

      setEmployees(formattedEmployees);
      
      // Actualizar estadísticas
      setStats({
        totalEmployees: formattedEmployees.length || 0,
        activeEmployees: formattedEmployees.filter(e => e.status === 'active').length || 0,
        shiftsToday: formattedEmployees.filter(e => e.work_shift === 'morning').length || 0
      });

    } catch (error) {
      console.error('Error loading employees:', error);
      if (error instanceof Error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        setError('Error desconocido al cargar empleados');
        toast.error('Error desconocido al cargar empleados');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar áreas
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!userData?.organization_id) return;

        const { data: areasData } = await supabase
          .from('areas')
          .select('id, name')
          .eq('organization_id', userData.organization_id);

        if (areasData) {
          setAreas(areasData);
        }
      } catch (error) {
        console.error('Error loading areas:', error);
      }
    };

    loadAreas();
  }, []);

  // Funciones de manejo de empleados
  const handleEditEmployee = async (employee: Employee) => {
    try {
      setSelectedEmployee(employee);
      setShowModal(true);
    } catch (error) {
      console.error('Error al editar empleado:', error);
      toast.error('Error al editar empleado');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      if (!window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
        return;
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEmployees(employees.filter(emp => emp.id !== id));
      toast.success('Usuario eliminado exitosamente');
      loadEmployees(); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      toast.error('Error al eliminar empleado');
    }
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: updatedEmployee.first_name,
          last_name: updatedEmployee.last_name,
          position: updatedEmployee.position,
          department: updatedEmployee.department,
          status: updatedEmployee.status,
        })
        .eq('id', updatedEmployee.id);

      if (error) throw error;

      setEmployees(employees.map(emp => 
        emp.id === updatedEmployee.id ? updatedEmployee : emp
      ));
      setShowModal(false);
      toast.success('Usuario actualizado exitosamente');
      loadEmployees(); // Recargar la lista
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      toast.error('Error al actualizar empleado');
    }
  };

  const handleCreateEmployee = async (newEmployee: Omit<Employee, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) throw new Error('Usuario no tiene organización asignada');

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            ...newEmployee,
            organization_id: userData.organization_id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setEmployees([...employees, data]);
      setShowAddModal(false);
      toast.success('Usuario creado exitosamente');
      loadEmployees(); // Recargar la lista
    } catch (error) {
      console.error('Error al crear empleado:', error);
      toast.error('Error al crear empleado');
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

  // Agregar función handleCreateShift
  const handleCreateShift = async () => {
    try {
      console.log('Datos del formulario:', {
        selectedSala,
        selectedArea,
        selectedUser,
        selectedTurno
      });

      if (!selectedSala || !selectedArea || !selectedUser || !selectedTurno) {
        toast.error('Por favor complete todos los campos');
        return;
      }

      const turno = TURNOS.find(t => t.id === selectedTurno);
      if (!turno) {
        toast.error('Turno inválido');
        return;
      }

      // Crear fecha de inicio y fin basado en el turno seleccionado
      const today = new Date();
      const startTime = new Date(today);
      const [startHour, startMinute] = turno.inicio.split(':');
      startTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

      const endTime = new Date(today);
      const [endHour, endMinute] = turno.fin.split(':');
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

      // Si el turno es nocturno y la hora de fin es menor que la de inicio,
      // significa que termina al día siguiente
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) throw new Error('Usuario no tiene organización asignada');

      const shiftData = {
        organization_id: userData.organization_id,
        sala_id: selectedSala,
        area_id: selectedArea,
        user_id: selectedUser,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled'
      };

      console.log('Datos del turno a crear:', shiftData);

      const { error: insertError } = await supabase
        .from('work_shifts')
        .insert([shiftData]);

      if (insertError) throw insertError;

      toast.success('Turno creado exitosamente');
      setShowShiftModal(false);
      
      // Resetear los estados
      setSelectedUser('');
      setSelectedSala(null);
      setSelectedArea('');
      setSelectedTurno('');
      
    } catch (error) {
      console.error('Error al crear turno:', error);
      toast.error('Error al crear el turno');
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Recursos Humanos</h1>
            <p className="text-blue-100">Gestión de personal y turnos</p>
          </div>
          <div className="flex gap-4">
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ color: 'white' }}
            >
              <option value="" className="text-gray-900">Todos los departamentos</option>
              <option value="Emergencias" className="text-gray-900">Emergencias</option>
              <option value="Consulta" className="text-gray-900">Consulta Externa</option>
              <option value="Quirofano" className="text-gray-900">Quirófano</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ color: 'white' }}
            >
              <option value="" className="text-gray-900">Todos los estados</option>
              <option value="Activo" className="text-gray-900">Activo</option>
              <option value="Inactivo" className="text-gray-900">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Total Personal Card */}
          <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Total Personal</h2>
                <p className="text-4xl font-bold text-blue-600">{stats.totalEmployees}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Usuario
            </button>
          </div>

          {/* Turnos Activos Card */}
          <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Turnos Activos</h2>
                <p className="text-4xl font-bold text-green-600">{stats.shiftsToday}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowShiftModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Gestionar Turnos
            </button>
          </div>
        </div>

        {/* Grid container for Personal Registrado and Usuarios Especiales */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          {/* Personal Registrado Section */}
          <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h2 className="text-xl font-bold">Personal Registrado</h2>
                <span className="text-gray-500">Total: {employees.filter(emp => emp.role === 'usuario').length} empleados</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees
                    .filter(emp => emp.role === 'usuario')
                    .map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="font-medium text-blue-600">
                                  {(employee.first_name || '').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                  {employee.first_name} {employee.last_name}
                                  <div className={`w-2 h-2 rounded-full ${employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} 
                                       title={employee.status === 'active' ? 'Activo' : 'Inactivo'}></div>
                                </div>
                                <div className="text-sm text-gray-500">ID: {employee.id}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{employee.position}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{employee.department}</td>
                        <td className="px-6 py-4 text-sm">
                          <button onClick={() => handleEditEmployee(employee)} className="text-blue-600 hover:text-blue-900 mr-4">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteEmployee(employee.id)} className="text-red-600 hover:text-red-900">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usuarios Especiales Section */}
          <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold">Usuarios Especiales</h2>
                <span className="text-gray-500">Administradores y Enterprise</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {employees
                .filter(emp => emp.role === 'admin' || emp.role === 'enterprise' || emp.role === 'admin_principal')
                .map(employee => (
                  <div key={employee.id} className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-cyan-200 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium text-lg">
                            {(employee.first_name || '').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-cyan-600">
                            {employee.role === 'admin_principal' ? 'Admin Principal' : 
                             employee.role === 'enterprise' ? 'Enterprise' : 'Administrador'}
                          </div>
                          <div className="text-xs text-gray-500">ID: {employee.id}</div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => handleEditEmployee(employee)} className="text-cyan-600 hover:text-cyan-900">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteEmployee(employee.id)} className="text-red-600 hover:text-red-900">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showAddModal && <AddEmployeeModal />}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Usuario</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateEmployee(selectedEmployee);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={selectedEmployee.first_name || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, first_name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apellido</label>
                  <input
                    type="text"
                    value={selectedEmployee.last_name || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, last_name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cargo</label>
                  <input
                    type="text"
                    value={selectedEmployee.position || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, position: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Departamento</label>
                  <input
                    type="text"
                    value={selectedEmployee.department || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, department: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={selectedEmployee.status}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, status: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Turnos */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Crear Nuevo Turno</h2>
            
            <div className="space-y-4">
              {/* Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Usuario</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccione un usuario</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {`${employee.first_name} ${employee.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sala y Área */}
              <SalaAreaSelector
                onSalaChange={(sala) => setSelectedSala(sala?.id || null)}
                onAreaChange={(area) => setSelectedArea(area?.id || '')}
                className="space-y-4"
              />

              {/* Turno */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Turno</label>
                <select
                  value={selectedTurno}
                  onChange={(e) => setSelectedTurno(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccione un turno</option>
                  {TURNOS.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {`${turno.nombre} (${turno.inicio} - ${turno.fin})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowShiftModal(false);
                  setSelectedUser('');
                  setSelectedSala(null);
                  setSelectedArea('');
                  setSelectedTurno('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateShift}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Crear Turno
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
    </div>
  );
}
