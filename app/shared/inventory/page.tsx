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
        const aValue = a[sortConfig.key] ?? ''
        const bValue = b[sortConfig.key] ?? ''
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Inventario</h1>
            <button
              onClick={() => {
                setSelectedItem(undefined)
                setModalMode('create')
                setIsModalOpen(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium 
                       rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-blue-500 transition-all duration-200 shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Item
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Stock Crítico</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ubicaciones</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.locations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de stock bajo */}
        {showAlerts && lowStockItems.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-yellow-200 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Stock Crítico</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {lowStockItems.length} {lowStockItems.length === 1 ? 'item requiere' : 'items requieren'} atención
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="border-t border-yellow-100 bg-yellow-50 px-6 py-3">
              <div className="grid gap-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2"></div>
                      <span className="text-sm text-gray-600">{item.name}: {item.quantity} {item.unit} (Mínimo: {item.min_stock})</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedItem(item)
                        setModalMode('restock')
                        setIsModalOpen(true)
                      }}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-yellow-700 
                               bg-yellow-100 hover:bg-yellow-200 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      Reponer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contenedor principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Barra de herramientas */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 maxw-lg">
                <input
                  type="text"
                  placeholder="Buscar en inventario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50
                           text-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg
                           bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                           focus:border-transparent transition-all duration-200"
                >
                  <option value="all">Todos los estados</option>
                  <option value="available">Disponible</option>
                  <option value="low">Stock bajo</option>
                  <option value="out_of_stock">Sin stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    { key: 'name', label: 'Nombre', width: '25%' },
                    { key: 'quantity', label: 'Stock', width: '12%' },
                    { key: 'min_stock', label: 'Stock Mínimo', width: '12%' },
                    { key: 'location', label: 'Ubicación', width: '15%' },
                    { key: 'status', label: 'Estado', width: '12%' },
                    { key: 'organization', label: 'Organización', width: '12%' },
                    { key: 'updated_at', label: 'Actualizado', width: '12%' },
                    { key: 'actions', label: '', width: '120px' }
                  ].map(({ key, label, width }) => (
                    <th
                      key={key}
                      style={{ width }}
                      onClick={() => key !== 'actions' && setSortConfig(current => ({
                        key: key as keyof InventoryItem,
                        direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
                      }))}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                ${key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        {key !== 'actions' && sortConfig.key === key && (
                          <span className="text-blue-500">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <div className="text-red-500">{error}</div>
                    </td>
                  </tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mr-2 ${
                          item.quantity > item.min_stock ? 'bg-green-400' :
                          item.quantity === 0 ? 'bg-red-400' : 'bg-yellow-400'
                        }`}></span>
                        <span className="text-sm text-gray-600">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.min_stock} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.location}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${item.quantity > item.min_stock
                          ? 'bg-green-100 text-green-800'
                          : item.quantity === 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {item.quantity > item.min_stock ? 'Disponible' :
                         item.quantity === 0 ? 'Sin Stock' : 'Stock Bajo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.organization?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end -space-x-1">
                        <button
                          onClick={() => handleEditClick(item)}
                          title="Editar"
                          className="relative inline-flex items-center justify-center p-2 text-gray-600 
                                   hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200
                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setModalMode('use')
                            setIsModalOpen(true)
                          }}
                          title="Gestionar Stock"
                          className="relative inline-flex items-center justify-center p-2 text-gray-600 
                                   hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-200
                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas eliminar este item?')) {
                              deleteInventoryItem(item.id)
                            }
                          }}
                          title="Eliminar"
                          className="relative inline-flex items-center justify-center p-2 text-gray-600 
                                   hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200
                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
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
        onSubmit={handleModalSubmit}
        item={selectedItem}
        mode={modalMode}
      />
    </div>
  )
}
