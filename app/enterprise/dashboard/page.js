'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';

export default function EnterpriseOverviewPage() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los datos
  const [personal, setPersonal] = useState([]);
  const [areasTareas, setAreasTareas] = useState([]);
  const [turnosData, setTurnosData] = useState([]);
  const [areasData, setAreasData] = useState([]);
  const [inventarioCritico, setInventarioCritico] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener personal desde la tabla users
      const { data: personalData, error: personalError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee');
      if (personalError) {
        console.error('Error fetching users:', personalError);
        setPersonal([]);
      } else {
        setPersonal(personalData || []);
      }

      // Obtener áreas y tareas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select(`
          *,
          tasks (*)
        `);
      if (areasError) {
        console.error('Error fetching areas:', areasError);
        setAreasTareas([]);
      } else {
        setAreasTareas(areasData || []);
      }

      // Obtener turnos desde work_shifts
      const { data: turnosData, error: turnosError } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('status', 'active');
      if (turnosError) {
        console.error('Error fetching shifts:', turnosError);
        setTurnosData([]);
      } else {
        setTurnosData(turnosData || []);
      }

      // Obtener inventario crítico desde items
      const { data: inventarioData, error: inventarioError } = await supabase
        .from('items')
        .select('*')
        .lt('quantity', 'min_quantity');
      if (inventarioError) {
        console.error('Error fetching inventory:', inventarioError);
        setInventarioCritico([]);
      } else {
        setInventarioCritico(inventarioData || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error general:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Función para navegar al inventario completo
  const irAInventario = () => {
    router.push('/shared/inventory');
  };

  // Función para navegar a la vista detallada de un área
  const verDetalleArea = (areaId) => {
    router.push(`/admin/assignments/${areaId}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6">Cargando...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 p-6">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Turnos */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Turnos Activos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {turnosData.map((turno) => (
              <button
                key={turno.id}
                onClick={() => {
                  setSelectedTurno(turno);
                  setShowTurnoModal(true);
                }}
                className="bg-white rounded-xl shadow-lg p-6 transform transition-all 
                         hover:scale-105 hover:shadow-xl focus:outline-none"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{turno.nombre}</h3>
                    <p className="text-sm text-gray-500">{turno.horario}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${turno.color}20`, color: turno.color }}>
                    {turno.personal_activo} activos
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Capacidad</span>
                    <span className="font-medium">{turno.personal_activo}/{turno.capacidad_total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(turno.personal_activo / turno.capacidad_total) * 100}%`,
                        backgroundColor: turno.color
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Gráfico de Distribución */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Distribución por Áreas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Dona */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areasData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="personal_total"
                    >
                      {areasData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Lista de Áreas */}
              <div className="space-y-3">
                {areasData.map((area) => (
                  <div 
                    key={area.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="font-medium text-gray-700">
                        {area.nombre}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {area.personal_total} personal
                      </span>
                      <span className="text-sm font-medium" style={{ color: area.color }}>
                        {`${Math.round((area.personal_total / areasData.reduce((acc, curr) => acc + curr.personal_total, 0)) * 100)}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Inventario Crítico */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Inventario Crítico</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-3">
              {inventarioCritico.map((item) => (
                <div key={item.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{item.nombre}</h4>
                      <p className="text-xs text-gray-500">{item.area}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${item.stock < item.stock_minimo * 0.5
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.stock} unidades
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        item.stock < item.stock_minimo * 0.5 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{
                        width: `${Math.min((item.stock / item.stock_minimo) * 100, 100)}%`
                      }}
                    />
                  </div>
                  
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>Último uso: {new Date(item.ultimo_uso).toLocaleDateString()}</span>
                    <span>Mínimo: {item.stock_minimo}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={irAInventario}
              className="mt-6 w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg
                       hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
            >
              Ver Inventario Completo
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Tareas por Área */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tareas por Área</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areasTareas.map((area) => (
            <div key={area.id} className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: area.color }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{area.nombre}</h3>
                <span className="text-sm text-gray-500">{area.tareas.length} tareas</span>
              </div>
              
              <div className="space-y-4">
                {area.tareas.map((tarea) => (
                  <div key={tarea.id} className="space-y-2">
                    <div className="text-sm">
                      <div className="font-medium">{tarea.descripcion}</div>
                      <div className="text-gray-500">Asignado a: {tarea.asignado}</div>
                      <div className="flex items-center text-xs text-gray-500 space-x-1">
                        <FaClock className="w-3 h-3" />
                        <span>{tarea.fecha_inicio ? new Date(tarea.fecha_inicio).toLocaleString() : 'No iniciada'}</span>
                      </div>
                    </div>
                    
                    <div className="h-1 bg-gray-200 rounded">
                      <div
                        className="h-1 rounded transition-all duration-300"
                        style={{
                          width: `${tarea.estado === 'completada' ? 100 : tarea.estado === 'en_progreso' ? 50 : 0}%`,
                          backgroundColor: area.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      {showTurnoModal && selectedTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          {/* ... contenido del modal ... */}
        </div>
      )}

      {showAreaModal && selectedArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          {/* ... contenido del modal ... */}
        </div>
      )}
    </div>
  );
}