'use client'
import { useState, useEffect, useMemo } from 'react'

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
  estimatedDuration: number
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

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'cleaning': return 'Limpieza'
    case 'safety': return 'Seguridad'
    case 'tools': return 'Herramientas'
    default: return category
  }
}

export default function EnterpriseInventoryPage() {
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
  const [search, setSearch] = useState('')

  // Estado para alertas
  const [showAlerts, setShowAlerts] = useState(true)

  // Obtener items con stock bajo
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.quantity <= item.minStock)
  }, [items])

  // Cargar datos en un useEffect
  useEffect(() => {
    // Intentar obtener datos del API primero (si existe)
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setItems(data);
          return;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        console.error('Error fetching inventory:', errorMessage);
      }

      // Si no hay API o falla, usar localStorage como respaldo
      const savedItems = localStorage.getItem('inventoryItems')
      if (savedItems) {
        try {
          const parsedItems = JSON.parse(savedItems)
          setItems(parsedItems)
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          console.error('Error parsing saved items:', errorMessage)
          setItems([])
        }
      }
    };

    fetchInventory();

    // Suscribirse a cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inventoryItems' && e.newValue) {
        try {
          const parsedItems = JSON.parse(e.newValue)
          setItems(parsedItems)
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          console.error('Error parsing updated items:', errorMessage)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-50">
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
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Inventario
            </h2>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-4">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total de Items</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
            </div>
            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Items con Stock Bajo</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.lowStock}</dd>
            </div>
            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Ubicaciones</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.locations}</dd>
            </div>
          </dl>
        </div>

        {/* Filtros y búsqueda */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="search" className="sr-only">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Buscar items..."
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2.5 
                       border border-gray-200 rounded-lg
                       text-gray-600 text-base
                       bg-white
                       shadow-sm
                       focus:ring-2 focus:ring-blue-100 
                       focus:border-blue-400
                       transition-all duration-200"
            >
              <option value="all">Todas las categorías</option>
              <option value="cleaning">Limpieza</option>
              <option value="safety">Seguridad</option>
              <option value="tools">Herramientas</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2.5 
                       border border-gray-200 rounded-lg
                       text-gray-600 text-base
                       bg-white
                       shadow-sm
                       focus:ring-2 focus:ring-blue-100 
                       focus:border-blue-400
                       transition-all duration-200"
            >
              <option value="all">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="low">Bajo stock</option>
              <option value="out_of_stock">Sin stock</option>
            </select>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="mt-6 bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => setSortConfig({ key: 'name', direction: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  Nombre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => setSortConfig({ key: 'category', direction: sortConfig.key === 'category' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  Categoría
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => setSortConfig({ key: 'quantity', direction: sortConfig.key === 'quantity' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => setSortConfig({ key: 'location', direction: sortConfig.key === 'location' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  Ubicación
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => setSortConfig({ key: 'status', direction: sortConfig.key === 'status' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Última Actualización
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCategoryLabel(item.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${item.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                      ${item.status === 'low' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${item.status === 'out_of_stock' ? 'bg-red-100 text-red-800' : ''}`}>
                      {item.status === 'available' ? 'Disponible' : ''}
                      {item.status === 'low' ? 'Stock Bajo' : ''}
                      {item.status === 'out_of_stock' ? 'Sin Stock' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 