'use client'
import { useState, useEffect, useMemo } from 'react'
import InventoryModal from './components/InventoryModal'
import { toast } from 'react-hot-toast'

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  location: string
  status: 'available' | 'low' | 'out_of_stock'
  lastUpdated: string
  lastUsed: string
  usageHistory: UsageRecord[]
  restockHistory: RestockRecord[]
  estimatedDuration: number // en días
}

interface UsageRecord {
  id: string
  quantity: number
  date: string
  user: string
}

interface RestockRecord {
  id: string
  quantity: number
  date: string
  supplier: string
}

interface InventoryFormData {
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  location: string
  estimatedDuration: number
}

interface UsageFormData {
  operationQuantity: number
  date: string
  user: string
}

interface RestockFormData {
  operationQuantity: number
  date: string
  supplier: string
}

type ModalFormData = InventoryFormData | UsageFormData | RestockFormData

// Agregar aquí los datos mock
const MOCK_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'Jabón líquido',
    category: 'cleaning',
    quantity: 50,
    unit: 'litros',
    minStock: 20,
    location: 'Almacén A',
    status: 'available',
    lastUpdated: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    estimatedDuration: 30,
    usageHistory: [
      {
        id: '1',
        quantity: 2,
        date: '2024-01-10',
        user: 'Juan Pérez'
      }
    ],
    restockHistory: [
      {
        id: '1',
        quantity: 10,
        date: '2024-01-15',
        supplier: 'Limpieza SA'
      }
    ]
  },
  {
    id: '2',
    name: 'Guantes de látex',
    category: 'safety',
    quantity: 15,
    unit: 'cajas',
    minStock: 25,
    location: 'Almacén B',
    status: 'low',
    lastUpdated: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    estimatedDuration: 30,
    usageHistory: [],
    restockHistory: []
  },
  {
    id: '3',
    name: 'Alcohol 70%',
    category: 'cleaning',
    quantity: 0,
    unit: 'litros',
    minStock: 30,
    location: 'Almacén A',
    status: 'out_of_stock',
    lastUpdated: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    estimatedDuration: 30,
    usageHistory: [],
    restockHistory: []
  }
]

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'cleaning': return 'Limpieza'
    case 'safety': return 'Seguridad'
    case 'tools': return 'Herramientas'
    default: return category
  }
}

export default function InventoryPage() {
  // Estado para el ordenamiento
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });

  // Estado para filtros
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  })

  // Inicializar items con un array vacío
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<'edit' | 'usage' | 'restock'>('edit')

  // Estado para alertas
  const [showAlerts, setShowAlerts] = useState(true)

  // Obtener items con stock bajo
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.quantity <= item.minStock)
  }, [items])

  // Cargar datos en un useEffect
  useEffect(() => {
    const savedItems = localStorage.getItem('inventoryItems')
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems)
        setItems(parsedItems)
      } catch (error) {
        console.error('Error parsing saved items:', error)
        setItems(MOCK_ITEMS)
      }
    } else {
      setItems(MOCK_ITEMS)
    }
  }, [])

  // Función para actualizar items y localStorage
  const updateItems = (newItems: InventoryItem[]) => {
    setItems(newItems)
    try {
      localStorage.setItem('inventoryItems', JSON.stringify(newItems))
    } catch (error) {
      console.error('Error saving items:', error)
    }
  }

  // Filtrar y ordenar items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    // Aplicar filtros
    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category)
    }
    if (filters.status !== 'all') {
      result = result.filter(item => item.status === filters.status)
    }

    // Aplicar búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower) ||
        getCategoryLabel(item.category).toLowerCase().includes(searchLower)
      )
    }

    // Ordenar
    return result.sort((a, b) => {
      if (sortConfig.key === 'status') {
        const statusOrder = { available: 0, low: 1, out_of_stock: 2 }
        const comparison = statusOrder[a.status] - statusOrder[b.status]
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortConfig, filters, search])

  // Estadísticas generales
  const stats = useMemo(() => {
    const total = items.length
    const lowStock = items.filter(item => item.status === 'low').length
    const locations = new Set(items.map(item => item.location)).size

    return { total, lowStock, locations }
  }, [items])

  // Estado para controlar el modal de creación
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para crear el item
    setShowCreateModal(false)
    toast.success('Item creado exitosamente')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header con botón de crear */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                   transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Agregar Item
        </button>
      </div>

      {/* Alertas de stock bajo */}
      {showAlerts && lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center">
                <span className="flex p-1">
                  ⚠️
                </span>
                <div className="ml-2 font-medium text-yellow-800 text-sm">
                  <span className="md:hidden">Stock crítico en {lowStockItems.length} items</span>
                  <span className="hidden md:inline">
                    Hay {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'} con stock crítico
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowAlerts(false)}
                  className="flex p-1 rounded-md hover:bg-yellow-100"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-4 w-4 text-yellow-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Lista detallada de items con stock bajo */}
            <div className="mt-1 space-y-1">
              {lowStockItems.map(item => (
                <div key={item.id} className="text-xs text-yellow-800 flex justify-between items-center">
                  <span>{item.name}: {item.quantity} {item.unit} (Crítico: {item.minStock})</span>
                  <button
                    onClick={() => {
                      setSelectedItem(item)
                      setModalMode('restock')
                      setIsModalOpen(true)
                    }}
                    className="ml-2 px-2 py-0.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100 rounded"
                  >
                    Reponer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header con estadísticas */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Total Items</h3>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">Items en Estado Crítico</h3>
                <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Ubicaciones</h3>
                <p className="text-2xl font-bold text-green-900">{stats.locations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Barra de herramientas */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 min-w-[300px]">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, categoría o ubicación..."
                    className="w-full px-10 py-2.5 
                             border border-gray-200 rounded-lg
                             text-gray-600 text-base
                             placeholder-gray-400
                             bg-white
                             shadow-sm
                             focus:ring-2 focus:ring-blue-100 
                             focus:border-blue-400
                             transition-all duration-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>

                <button 
                  className="flex items-center gap-2 px-4 py-2.5
                           bg-blue-500 hover:bg-blue-600
                           text-white font-medium
                           rounded-lg shadow-sm
                           transition-colors duration-200"
                  onClick={() => {
                    setSelectedItem(undefined)
                    setModalMode('edit')
                    setIsModalOpen(true)
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Nuevo Item</span>
                </button>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-4">
                <select
                  className="select select-bordered"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="all">Todas las categorías</option>
                  <option value="cleaning">Limpieza</option>
                  <option value="safety">Seguridad</option>
                  <option value="tools">Herramientas</option>
                </select>

                <select
                  className="select select-bordered"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">Todos los estados</option>
                  <option value="available">Disponible</option>
                  <option value="low">Bajo stock</option>
                  <option value="out_of_stock">Sin stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: 'name', label: 'Nombre' },
                    { key: 'category', label: 'Categoría' },
                    { key: 'quantity', label: 'Stock' },
                    { key: 'minStock', label: 'Stock Mínimo' },
                    { key: 'location', label: 'Ubicación' },
                    { key: 'status', label: 'Estado' },
                    { key: 'lastUpdated', label: 'Última Actualización' }
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => setSortConfig(current => ({
                        key: key as keyof InventoryItem,
                        direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
                      }))}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        <span className={`transition-opacity ${
                          sortConfig.key === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                        }`}>
                          {sortConfig.key === key && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`mr-2 h-2 w-2 rounded-full ${
                          item.quantity > item.minStock ? 'bg-green-400' :
                          item.quantity === 0 ? 'bg-red-400' : 'bg-yellow-400'
                        }`}></span>
                        <span className="text-sm text-gray-500">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'available' ? 'bg-green-100 text-green-800' :
                        item.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 'available' ? '✓ Disponible' :
                         item.status === 'low' ? '⚠️ Bajo Stock' :
                         ' Sin Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.lastUpdated).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botón combinado de Uso/Reposición */}
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          onClick={() => {
                            setSelectedItem(item)
                            setModalMode('usage')
                            setIsModalOpen(true)
                          }}
                          title="Gestionar Stock"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M4 7h16M4 12h16m-7-5v10" />
                          </svg>
                        </button>

                        {/* Botón de Editar */}
                        <button
                          className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                          onClick={() => {
                            setSelectedItem(item)
                            setModalMode('edit')
                            setIsModalOpen(true)
                          }}
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Botón de Eliminar */}
                        <button
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar este item?')) {
                              const newItems = items.filter(i => i.id !== item.id)
                              updateItems(newItems)
                            }
                          }}
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InventoryModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setModalMode('edit')
        }}
        onSubmit={(data) => {
          if (modalMode === 'usage' && selectedItem) {
            const updatedItem = data as InventoryItem
            const newItems = items.map(item => 
              item.id === selectedItem.id ? updatedItem : item
            )
            updateItems(newItems)
          } else if (modalMode === 'restock' && selectedItem) {
            const updatedItem = data as InventoryItem
            const newItems = items.map(item => 
              item.id === selectedItem.id ? updatedItem : item
            )
            updateItems(newItems)
          } else if (selectedItem) {
            const formData = data as InventoryFormData
            const updatedItem: InventoryItem = {
              ...selectedItem,
              ...formData,
              status: formData.quantity > formData.minStock ? 'available' : 
                     formData.quantity === 0 ? 'out_of_stock' : 'low',
              lastUpdated: new Date().toISOString()
            }
            const newItems = items.map(item => 
              item.id === selectedItem.id ? updatedItem : item
            )
            updateItems(newItems)
          } else {
            const formData = data as InventoryFormData
            const newItem: InventoryItem = {
              ...formData,
              id: Date.now().toString(),
              quantity: 0,
              status: 'out_of_stock',
              lastUpdated: new Date().toISOString(),
              lastUsed: new Date().toISOString(),
              usageHistory: [],
              restockHistory: [],
              estimatedDuration: formData.estimatedDuration || 30
            }
            updateItems([newItem, ...items])
          }
          setIsModalOpen(false)
          setModalMode('edit')
        }}
        item={selectedItem}
        mode={modalMode}
      />

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Agregar Nuevo Item
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Item
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  >
                    <option value="">Seleccionar unidad</option>
                    <option value="unidades">Unidades</option>
                    <option value="litros">Litros</option>
                    <option value="kilogramos">Kilogramos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                             rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                             rounded-lg hover:bg-blue-700"
                  >
                    Crear Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
