'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import InventoryModal from './components/InventoryModal'

interface InventoryItem {
  id: string
  nombre: string
  categoria: string
  cantidad: number
  unidad: string
  stock_minimo: number
  ubicacion: string
  estado: 'disponible' | 'bajo' | 'agotado'
  ultima_actualizacion: string
  ultimo_uso: string
  duracion_estimada: number
}

interface UsageRecord {
  id: string
  cantidad: number
  fecha: string
  usuario: string
}

interface RestockRecord {
  id: string
  cantidad: number
  fecha: string
  proveedor: string
}

interface InventoryFormData {
  nombre: string
  categoria: string
  cantidad: number
  unidad: string
  stock_minimo: number
  ubicacion: string
  duracion_estimada: number
}

interface UsageFormData {
  cantidad_operacion: number
  fecha: string
  usuario: string
}

interface RestockFormData {
  cantidad_operacion: number
  fecha: string
  proveedor: string
}

type ModalFormData = InventoryFormData | UsageFormData | RestockFormData

const getCategoryLabel = (categoria: string) => {
  switch (categoria) {
    case 'limpieza': return 'Limpieza'
    case 'seguridad': return 'Seguridad'
    case 'herramientas': return 'Herramientas'
    default: return categoria
  }
}

export default function InventoryPage() {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem;
    direction: 'asc' | 'desc';
  }>({ key: 'nombre', direction: 'asc' });

  const [filters, setFilters] = useState({
    categoria: 'all',
    estado: 'all'
  })

  const [items, setItems] = useState<InventoryItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<'edit' | 'usage' | 'restock'>('edit')
  const [showAlerts, setShowAlerts] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const lowStockItems = useMemo(() => {
    return items.filter(item => item.cantidad <= item.stock_minimo)
  }, [items])

  useEffect(() => {
    fetchInventory()
    
    const inventorySubscription = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchInventory()
      })
      .subscribe()

    return () => {
      inventorySubscription.unsubscribe()
    }
  }, [filters])

  const fetchInventory = async () => {
    try {
      console.log('1. Iniciando obtención de inventario...')
      setLoading(true)
      setError(null)

      let query = supabase
        .from('items')
        .select('*')
        .order('nombre')

      if (filters.categoria !== 'all') {
        query = query.eq('categoria', filters.categoria)
      }
      if (filters.estado !== 'all') {
        query = query.eq('estado', filters.estado)
      }

      console.log('2. Consultando tabla items...')
      const { data: inventoryData, error: inventoryError } = await query

      if (inventoryError) throw inventoryError
      console.log('3. Datos obtenidos:', inventoryData)

      const transformedItems: InventoryItem[] = inventoryData.map(item => ({
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        cantidad: item.cantidad,
        unidad: item.unidad,
        stock_minimo: item.stock_minimo,
        ubicacion: item.ubicacion,
        estado: item.estado === 'available' ? 'disponible' : 
               item.estado === 'low' ? 'bajo' : 'agotado',
        ultima_actualizacion: item.ultima_actualizacion,
        ultimo_uso: item.ultimo_uso,
        duracion_estimada: item.duracion_estimada
      }))

      console.log('4. Datos transformados:', transformedItems)
      setItems(transformedItems)

    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el inventario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-4">
              <select
                value={filters.categoria}
                onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value }))}
                className="rounded border p-2"
              >
                <option value="all">Todas las categorías</option>
                <option value="limpieza">Limpieza</option>
                <option value="seguridad">Seguridad</option>
                <option value="herramientas">Herramientas</option>
              </select>
              <select
                value={filters.estado}
                onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                className="rounded border p-2"
              >
                <option value="all">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="bajo">Stock Bajo</option>
                <option value="agotado">Agotado</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSelectedItem(undefined)
                setModalMode('edit')
                setIsModalOpen(true)
              }}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Agregar Item
            </button>
          </div>

          {/* Low Stock Alerts */}
          {showAlerts && lowStockItems.length > 0 && (
            <div className="mb-6 rounded bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-yellow-800">Alertas de Stock Bajo</h3>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </div>
              <ul className="mt-2">
                {lowStockItems.map(item => (
                  <li key={item.id} className="text-yellow-700">
                    {item.nombre} - Cantidad actual: {item.cantidad} {item.unidad} (Mínimo: {item.stock_minimo})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Inventory Table */}
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cantidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Última Actualización
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-6 py-4">{item.nombre}</td>
                    <td className="whitespace-nowrap px-6 py-4">{getCategoryLabel(item.categoria)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {item.cantidad} {item.unidad}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        item.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                        item.estado === 'bajo' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(item.ultima_actualizacion).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setModalMode('edit')
                            setIsModalOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setModalMode('usage')
                            setIsModalOpen(true)
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Usar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setModalMode('restock')
                            setIsModalOpen(true)
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Reabastecer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <InventoryModal
              mode={modalMode}
              item={selectedItem}
              onClose={() => {
                setIsModalOpen(false)
                setSelectedItem(undefined)
              }}
              onSubmit={fetchInventory}
            />
          )}
        </>
      )}
    </div>
  )
}
