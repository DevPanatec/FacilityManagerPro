'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import InventoryModal from './components/InventoryModal'

interface InventoryItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  category: string
  quantity: number
  unit: string
  min_stock: number
  location: string
  status: 'available' | 'low' | 'out_of_stock'
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
  }
}

interface UsageRecord {
  id: string
  inventory_id: string
  quantity: number
  date: string
  user_id: string
  created_at: string
  updated_at: string
}

interface RestockRecord {
  id: string
  inventory_id: string
  quantity: number
  date: string
  supplier: string
  created_at: string
  updated_at: string
}

interface InventoryFormData {
  name: string
  description?: string
  category: string
  quantity: number
  unit: string
  min_stock: number
  location: string
  organization_id?: string
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'cleaning': return 'Limpieza'
    case 'safety': return 'Seguridad'
    case 'tools': return 'Herramientas'
    default: return category
  }
}

export default function InventoryPage() {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });

  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  })

  const [items, setItems] = useState<InventoryItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<'edit' | 'use' | 'restock' | 'create'>('edit')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAlerts, setShowAlerts] = useState(true)

  const supabase = createClientComponentClient()

  // Cargar datos del inventario
  useEffect(() => {
    loadInventoryItems()
  }, [])

  const loadInventoryItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userData } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('Usuario no encontrado')

      console.log('User role:', userData.role); // Debug log

      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          organization:organizations(
            id,
            name
          )
        `)

      // Si no es superadmin, filtrar por organization_id
      if (userData.role !== 'superadmin') {
        if (!userData.organization_id) {
          throw new Error('Usuario no tiene organización asignada')
        }
        query = query.eq('organization_id', userData.organization_id)
      }

      const { data: items, error } = await query
      
      console.log('Query result:', { items, error }); // Debug log
      
      if (error) throw error
      
      setItems(items || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar el inventario')
    } finally {
      setLoading(false)
    }
  }

  // Función para actualizar items
  const updateInventoryItem = async (item: InventoryItem) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          name: item.name,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          min_stock: item.min_stock,
          location: item.location,
          status: item.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (error) throw error

      await loadInventoryItems()
      toast.success('Item actualizado correctamente')
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Error al actualizar el item')
    }
  }

  // Función para crear nuevo item
  const createInventoryItem = async (item: InventoryFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userData } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('Usuario no encontrado')

      // Si es superadmin y no se especificó organization_id, lanzar error
      if (userData.role === 'superadmin' && !item.organization_id) {
        throw new Error('Debe especificar una organización para el item')
      }

      const organization_id = userData.role === 'superadmin' 
        ? item.organization_id 
        : userData.organization_id

      const { error } = await supabase
        .from('inventory_items')
        .insert([{
          ...item,
          organization_id,
          status: item.quantity > item.min_stock ? 'available' : 
                 item.quantity === 0 ? 'out_of_stock' : 'low',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      await loadInventoryItems()
      toast.success('Item creado correctamente')
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Error al crear el item')
    }
  }

  // Función para registrar uso de item
  const registerItemUsage = async (itemId: string, quantity: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      // Registrar uso
      const { error: usageError } = await supabase
        .from('inventory_items_usage')
        .insert([{
          inventory_item_id: itemId,
          quantity,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (usageError) throw usageError

      // Actualizar cantidad en inventario
      const item = items.find(i => i.id === itemId)
      if (!item) throw new Error('Item no encontrado')

      const newQuantity = item.quantity - quantity
      const newStatus = newQuantity > item.min_stock ? 'available' : 
                       newQuantity === 0 ? 'out_of_stock' : 'low'

      await updateInventoryItem({
        ...item,
        quantity: newQuantity,
        status: newStatus
      })

      toast.success('Uso registrado correctamente')
    } catch (error) {
      console.error('Error registering usage:', error)
      toast.error('Error al registrar el uso')
    }
  }

  // Función para registrar reposición de item
  const registerItemRestock = async (itemId: string, quantity: number, supplier: string) => {
    try {
      // Registrar reposición
      const { error: restockError } = await supabase
        .from('inventory_items_restock')
        .insert([{
          inventory_item_id: itemId,
          quantity,
          supplier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (restockError) throw restockError

      // Actualizar cantidad en inventario
      const item = items.find(i => i.id === itemId)
      if (!item) throw new Error('Item no encontrado')

      const newQuantity = item.quantity + quantity
      const newStatus = newQuantity > item.min_stock ? 'available' : 
                       newQuantity === 0 ? 'out_of_stock' : 'low'

      await updateInventoryItem({
        ...item,
        quantity: newQuantity,
        status: newStatus
      })

      toast.success('Reposición registrada correctamente')
    } catch (error) {
      console.error('Error registering restock:', error)
      toast.error('Error al registrar la reposición')
    }
  }

  // Función para eliminar item
  const deleteInventoryItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      await loadInventoryItems()
      toast.success('Item eliminado correctamente')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Error al eliminar el item')
    }
  }

  // Filtrar y ordenar items
  const filteredItems = useMemo(() => {
    console.log('Filtering items:', { items, filters, search }); // Debug log
    
    let result = [...items]

    // Aplicar filtros
    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category)
    }

    // Actualizar el filtro de estado para usar la lógica de quantity vs min_stock
    if (filters.status !== 'all') {
      result = result.filter(item => {
        if (filters.status === 'available') return item.quantity > item.min_stock
        if (filters.status === 'low') return item.quantity <= item.min_stock && item.quantity > 0
        if (filters.status === 'out_of_stock') return item.quantity === 0
        return true
      })
    }

    // Aplicar búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower) ||
        getCategoryLabel(item.category).toLowerCase().includes(searchLower) ||
        item.organization?.name?.toLowerCase().includes(searchLower)
      )
    }

    // Ordenar
    if (sortConfig.key === 'organization') {
      result.sort((a, b) => {
        const aName = a.organization?.name || ''
        const bName = b.organization?.name || ''
        return sortConfig.direction === 'asc' 
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName)
      })
    } else {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    console.log('Filtered result:', result); // Debug log
    return result
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

  // Obtener items con stock bajo
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.quantity <= item.min_stock)
  }, [items])

  const handleModalSubmit = async (formData: any) => {
    try {
      if (modalMode === 'use' && selectedItem) {
        await registerItemUsage(selectedItem.id, formData.quantity)
      } else if (modalMode === 'restock' && selectedItem) {
        await registerItemRestock(selectedItem.id, formData.quantity, formData.supplier)
      } else if (selectedItem) {
        await updateInventoryItem({
          ...selectedItem,
          ...formData
        })
      } else {
        await createInventoryItem(formData)
      }
      setIsModalOpen(false)
      setModalMode('edit')
      loadInventoryItems() // Refresh the list after changes
    } catch (error) {
      console.error('Error in modal submit:', error)
      toast.error('Error al procesar la operación')
    }
  }

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setModalMode('use')
    setIsModalOpen(true)
  }

  const handleRestockClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setModalMode('restock')
    setIsModalOpen(true)
  }

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl font-semibold mb-4">{error}</div>
        <button
          onClick={loadInventoryItems}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header con botón de crear */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <button
          onClick={() => {
            setSelectedItem(undefined)
            setModalMode('create')
            setIsModalOpen(true)
          }}
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
                  <span>{item.name}: {item.quantity} {item.unit} (Crítico: {item.min_stock})</span>
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
          <div className="overflow-hidden bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {[
                        { key: 'name', label: 'Nombre' },
                        { key: 'category', label: 'Categoría' },
                        { key: 'quantity', label: 'Stock' },
                        { key: 'min_stock', label: 'Stock Mínimo' },
                        { key: 'location', label: 'Ubicación' },
                        { key: 'status', label: 'Estado' },
                        { key: 'organization', label: 'Organización' },
                        { key: 'last_updated', label: 'Última Actualización' }
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          onClick={() => setSortConfig(current => ({
                            key: key as keyof InventoryItem,
                            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
                          }))}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group bg-gray-50"
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`mr-2 h-2 w-2 rounded-full ${
                              item.quantity > item.min_stock ? 'bg-green-400' :
                              item.quantity === 0 ? 'bg-red-400' : 'bg-yellow-400'
                            }`}></span>
                            <span className="text-sm text-gray-500">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.min_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.quantity > item.min_stock ? 'bg-green-100 text-green-800' :
                            item.quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.quantity > item.min_stock ? 'Disponible' :
                             item.quantity === 0 ? 'Sin Stock' : 'Stock Bajo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.organization?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleRestockClick(item)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Reposición
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InventoryModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setModalMode('edit')
        }}
        onSubmit={handleModalSubmit}
        item={selectedItem}
        mode={modalMode}
      />
    </div>
  )
}
