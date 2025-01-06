'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Employee {
  id: number;
  nombre: string;
  cargo: string;
  departamento: string;
  turno: string;
  estado: 'Activo' | 'Inactivo';
  fechaIngreso: string;
  rol: 'usuario' | 'admin' | 'admin_principal' | 'enterprise';
  contacto: {
    email: string;
    telefono: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    shiftsToday: 0
  });

  // Estados para filtros
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Agregar estos estados
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTurnosModal, setShowTurnosModal] = useState(false);

  // Estados para asignaciones
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Funciones de manejo de empleados
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleDeleteEmployee = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
      toast.success('Usuario eliminado exitosamente');
    }
  };

  // Agregar useEffect para cargar datos de ejemplo
  useEffect(() => {
    setEmployees(exampleEmployees);
    setStats({
      totalEmployees: exampleEmployees.length,
      activeEmployees: exampleEmployees.filter(e => e.estado === 'Activo').length,
      shiftsToday: exampleEmployees.filter(e => e.turno === 'Mañana').length
    });
  }, []);

  // Agregar los modales y sus funciones
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newEmployee.password !== newEmployee.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      const employee: Employee = {
        id: employees.length + 1,
        nombre: `${newEmployee.nombre} ${newEmployee.apellido}`,
        cargo: newEmployee.rol,
        departamento: newEmployee.ubicacion,
        turno: '',
        estado: 'Activo',
        rol: newEmployee.rol as 'usuario' | 'admin' | 'enterprise',
        fechaIngreso: new Date().toISOString().split('T')[0],
        contacto: {
          email: `${newEmployee.username}@hospital.com`,
          telefono: ''
        }
      };
      
      setEmployees([...employees, employee]);
      setShowAddModal(false);
      toast.success('Usuario creado exitosamente');

      // Si es usuario regular, agregarlo al estado de turnos en AssignmentClient
      if (employee.rol === 'usuario') {
        // Aquí deberías implementar la lógica para actualizar AssignmentClient
        // Por ejemplo, usando un contexto global o una API
        const newAssignment = {
          user: employee.nombre,
          task: "",
          area: employee.departamento,
          shift: ""
        };
        
        // Actualizar el estado en AssignmentClient
        setAssignments(prev => [...prev, newAssignment]);
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

  // Agregar datos de ejemplo
  const exampleEmployees: Employee[] = [
    {
      id: 1,
      nombre: "Juan Pérez",
      cargo: "Médico General",
      departamento: "Emergencias",
      turno: "Mañana",
      estado: "Activo",
      fechaIngreso: "2024-01-15",
      rol: 'usuario',
      contacto: {
        email: "juan.perez@hospital.com",
        telefono: "0414-1234567"
      }
    },
    {
      id: 2,
      nombre: "María González",
      cargo: "Enfermera",
      departamento: "Quirofano",
      turno: "Tarde",
      estado: "Activo",
      fechaIngreso: "2024-02-01",
      rol: 'usuario',
      contacto: {
        email: "maria.gonzalez@hospital.com",
        telefono: "0424-7654321"
      }
    },
    {
      id: 3,
      nombre: "Carlos Rodríguez",
      cargo: "Especialista",
      departamento: "Consulta",
      turno: "Mañana",
      estado: "Activo",
      fechaIngreso: "2024-01-20",
      rol: 'usuario',
      contacto: {
        email: "carlos.rodriguez@hospital.com",
        telefono: "0412-9876543"
      }
    },
    {
      id: 4,
      nombre: "Admin Principal",
      cargo: "Administrador Principal",
      departamento: "Administración",
      turno: "Mañana",
      estado: "Activo",
      fechaIngreso: "2024-01-01",
      rol: 'admin_principal',
      contacto: {
        email: "admin.principal@hospital.com",
        telefono: "0414-9999999"
      }
    },
    {
      id: 5,
      nombre: "Enterprise User",
      cargo: "Enterprise",
      departamento: "Dirección",
      turno: "Mañana",
      estado: "Activo",
      fechaIngreso: "2024-01-01",
      rol: 'enterprise',
      contacto: {
        email: "enterprise@hospital.com",
        telefono: "0414-8888888"
      }
    }
  ];

  const handleNewAssignment = async (newAssignment: any) => {
    try {
      // Lógica para crear la asignación
      if (newAssignment) {
        // Actualizar el estado
        setAssignments(prev => [...prev, newAssignment])
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating assignment';
      console.error('Error creating assignment:', errorMessage);
    }
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

      {/* Tabla de empleados y Panel de Usuarios Especiales */}
      <div className="grid grid-cols-3 gap-6">
        {/* Tabla Principal */}
        <div className="col-span-2">
          <div className="bg-blue-600 p-6 rounded-t-xl text-white">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold">Personal Registrado</h2>
                <p className="text-blue-100 text-sm">Gestión de empleados activos</p>
              </div>
              <div className="ml-auto">
                <p className="text-sm text-blue-100">Total: {employees.filter(emp => emp.rol === 'usuario').length} empleados</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
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
                  .filter(emp => emp.rol === 'usuario')
                  .map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {employee.nombre.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.nombre}</div>
                            <div className="text-sm text-gray-500">ID: {employee.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.cargo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.departamento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.estado === 'Activo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Mostrando página {page} de {totalPages}
              </p>
            </div>
          </div>
        </div>

        {/* Panel de Usuarios Especiales */}
        <div>
          <div className="bg-gradient-to-r from-cyan-600 to-blue-500 p-6 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-white">Usuarios Especiales</h3>
                <p className="text-cyan-50 text-sm">Administradores y Enterprise</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-b-xl shadow-sm">
            <div className="p-6 space-y-4">
              {employees
                .filter(emp => emp.rol === 'admin' || emp.rol === 'enterprise' || emp.rol === 'admin_principal')
                .map(employee => (
                  <div key={employee.id} className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-cyan-200 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {employee.nombre.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.nombre}</div>
                          <div className="text-sm text-cyan-600">
                            {employee.cargo}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {employee.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditEmployee(employee)}
                          className="p-1 text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50 rounded-full"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
    </div>
  );
}
