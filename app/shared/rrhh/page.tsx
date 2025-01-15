'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Employee {
  id: string
  nombre: string
  cargo: string
  departamento: string
  turno: string
  estado: 'Activo' | 'Inactivo'
  fecha_ingreso: string
  rol: string
  email: string
  telefono: string
}

interface SpecialUser {
  id: string
  nombre: string
  rol: string
  departamento: string
  estado: 'Activo' | 'Inactivo'
}

export default function RRHHPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [totalPersonal, setTotalPersonal] = useState(0)
  const [turnosActivos, setTurnosActivos] = useState(0)
  const [personal, setPersonal] = useState<Employee[]>([])
  const [usuariosEspeciales, setUsuariosEspeciales] = useState<SpecialUser[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    fetchData()
    
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchData()
      })
      .subscribe()

    const shiftsSubscription = supabase
      .channel('shifts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_shifts' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      usersSubscription.unsubscribe()
      shiftsSubscription.unsubscribe()
    }
  }, [])

  const fetchData = async () => {
    try {
      console.log('1. Iniciando obtención de datos...')
      setLoading(true)
      setError(null)

      // Obtener empleados regulares
      console.log('2. Consultando tabla users para empleados...')
      const { data: employeesData, error: employeesError } = await supabase
        .from('users')
        .select('id, full_name, role, department, shift, status, entry_date, email, phone')
        .eq('role', 'employee')
        .order('full_name')

      if (employeesError) throw employeesError
      console.log('3. Respuesta de empleados:', employeesData)

      // Obtener usuarios especiales (admin/enterprise)
      console.log('4. Consultando tabla users para usuarios especiales...')
      const { data: specialData, error: specialError } = await supabase
        .from('users')
        .select('id, full_name, role, department, status')
        .in('role', ['admin', 'enterprise'])
        .order('full_name')

      if (specialError) throw specialError
      console.log('5. Respuesta de usuarios especiales:', specialData)

      // Obtener turnos activos
      console.log('6. Consultando tabla work_shifts para turnos activos...')
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('work_shifts')
        .select('id')
        .eq('status', 'active')

      if (shiftsError) throw shiftsError
      console.log('7. Respuesta de turnos:', shiftsData)

      // Transformar datos de empleados
      const transformedEmployees: Employee[] = employeesData.map(emp => ({
        id: emp.id,
        nombre: emp.full_name,
        cargo: emp.role,
        departamento: emp.department,
        turno: emp.shift,
        estado: emp.status === 'active' ? 'Activo' as const : 'Inactivo' as const,
        fecha_ingreso: emp.entry_date,
        rol: emp.role,
        email: emp.email,
        telefono: emp.phone
      }))

      // Transformar datos de usuarios especiales
      const transformedSpecial: SpecialUser[] = specialData.map(user => ({
        id: user.id,
        nombre: user.full_name,
        rol: user.role,
        departamento: user.department,
        estado: user.status === 'active' ? 'Activo' as const : 'Inactivo' as const
      }))

      setPersonal(transformedEmployees)
      setUsuariosEspeciales(transformedSpecial)
      setTotalPersonal(employeesData.length)
      setTurnosActivos(shiftsData.length)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 p-6">
        <h1 className="text-2xl font-bold text-white">Recursos Humanos</h1>
        <p className="mt-1 text-blue-100">Gestión de personal y turnos</p>
      </div>

      {loading ? (
        <div className="p-6">Cargando...</div>
      ) : error ? (
        <div className="p-6 text-red-500">Error: {error}</div>
      ) : (
        <div className="p-6">
          {/* Filters and Actions */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-4">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded border p-2"
              >
                <option value="">Todos los departamentos</option>
                {Array.from(new Set(personal.map(emp => emp.departamento))).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded border p-2"
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Statistics */}
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold">Total Personal</h3>
              <p className="mt-2 text-3xl font-bold">{totalPersonal}</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Crear Usuario
              </button>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold">Turnos Activos</h3>
              <p className="mt-2 text-3xl font-bold">{turnosActivos}</p>
              <button
                onClick={() => {/* TODO: Implementar gestión de turnos */}}
                className="mt-4 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Gestionar Turnos
              </button>
            </div>
          </div>

          {/* Personal Registrado */}
          <div className="mb-6 overflow-x-auto rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold">Personal Registrado</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Personal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Departamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {personal
                  .filter(emp => 
                    (!selectedDepartment || emp.departamento === selectedDepartment) &&
                    (!selectedStatus || emp.estado === selectedStatus)
                  )
                  .map(employee => (
                    <tr key={employee.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{employee.nombre}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">{employee.cargo}</td>
                      <td className="whitespace-nowrap px-6 py-4">{employee.departamento}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          employee.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.estado}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Usuarios Especiales */}
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold">Usuarios Especiales</h2>
              <p className="mt-1 text-sm text-gray-500">Administradores y Enterprise</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Departamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usuariosEspeciales.map(user => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{user.nombre}</td>
                    <td className="whitespace-nowrap px-6 py-4">{user.rol}</td>
                    <td className="whitespace-nowrap px-6 py-4">{user.departamento}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        user.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 