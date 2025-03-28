'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import InventoryModal from './components/InventoryModal'
import { PencilIcon, ArrowsUpDownIcon, TrashIcon } from '@heroicons/react/24/outline'
import { inventoryService } from '@/app/services/inventoryService'

interface InventoryItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  quantity: number
  unit: string
  min_stock: number
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
  quantity: number
  unit: string
  min_stock: number
  organization_id?: string
}

export default function InventoryPage() {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });

  const [filters, setFilters] = useState({
    status: 'all'
  })

  const [items, setItems] = useState<InventoryItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<'edit' | 'use' | 'restock' | 'operations' | 'create'>('edit')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAlerts, setShowAlerts] = useState(true)

  const supabase = createClientComponentClient()

  // Definir los handlers aquí, antes de useEffect
  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setModalMode('use')
    setIsModalOpen(true)
  }

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
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('Usuario no encontrado')
      if (!userData.organization_id) throw new Error('Usuario no tiene organización asignada')

      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('*, organization:organizations(id, name)')
        .eq('organization_id', userData.organization_id)
      
      if (error) {
        console.error('Error detallado:', error)
        throw error
      }
      
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
      const updateData = {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        min_stock: item.min_stock,
        unit: item.unit || 'unidad',
        status: item.status,
        updated_at: new Date().toISOString()
      };

      console.log('Actualizando item con datos:', updateData);

      const { error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', item.id);

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      await loadInventoryItems();
      toast.success('Item actualizado correctamente');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Error al actualizar el item');
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
      if (!userData.organization_id) throw new Error('Usuario no tiene organización asignada')

      const newItem = {
        name: item.name,
        description: item.description || null,
        organization_id: userData.organization_id,
        quantity: item.quantity || 0,
        unit: item.unit,
        min_stock: item.min_stock || 0,
        status: item.quantity === 0 ? 'out_of_stock' : 
                item.quantity <= item.min_stock ? 'low' : 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating item:', newItem)

      const { error } = await supabase
        .from('inventory_items')
        .insert([newItem])

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      await loadInventoryItems()
      toast.success('Item creado correctamente')
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Error al crear el item')
    }
  }

  // Función para registrar uso de item
  const registerItemUsage = async (itemId: string, data: any) => {
    try {
      console.log('Iniciando registerItemUsage:', { itemId, data })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const item = items.find(i => i.id === itemId)
      if (!item) {
        console.error('Item no encontrado:', itemId)
        throw new Error('Item no encontrado')
      }

      console.log('Item encontrado:', item)

      const now = new Date().toISOString()
      const quantity = Number(data.quantity)

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }

      if (quantity > item.quantity) {
        throw new Error('La cantidad no puede ser mayor al stock disponible')
      }

      await inventoryService.registerUsage(
        itemId,
        quantity,
        user.id,
        data.date || now,
        data.user_name,
        item.organization_id
      )

      await loadInventoryItems()
      toast.success('Uso registrado correctamente')
    } catch (error) {
      console.error('Error en registerItemUsage:', error)
      toast.error(error instanceof Error ? error.message : 'Error al registrar uso')
      throw error
    }
  }

  // Función para registrar reposición de item
  const registerItemRestock = async (itemId: string, data: any) => {
    try {
      console.log('Iniciando registerItemRestock:', { itemId, data })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const item = items.find(i => i.id === itemId)
      if (!item) {
        console.error('Item no encontrado:', itemId)
        throw new Error('Item no encontrado')
      }

      const now = new Date().toISOString()
      const quantity = Number(data.quantity)

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }

      await inventoryService.registerRestock(
        itemId,
        quantity,
        data.supplier || 'Sistema',
        data.date || now,
        item.organization_id
      )

      await loadInventoryItems()
      toast.success('Reposición registrada correctamente')
    } catch (error) {
      console.error('Error en registerItemRestock:', error)
      toast.error(error instanceof Error ? error.message : 'Error al registrar reposición')
      throw error
    }
  }

  // Función para manejar la operación según el modo
  const handleOperation = async (itemId: string, data: any, type?: 'use' | 'restock' | 'edit' | 'create') => {
    try {
      if (type === 'edit' || modalMode === 'edit') {
        await updateInventoryItem({
          ...selectedItem!,
          ...data
        })
        toast.success('Item actualizado correctamente')
      } else if (type === 'use') {
        await registerItemUsage(itemId, data)
      } else if (type === 'restock') {
        await registerItemRestock(itemId, data)
      }
      
      // Recargar items después de la operación
      await loadInventoryItems()
      // No cerramos el modal aquí para permitir que se actualice el historial
    } catch (error) {
      console.error('Error en operación:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar la operación')
    }
  }

  // Función para eliminar item
  const deleteInventoryItem = async (itemId: string) => {
    try {
      console.log('=== Inicio de eliminación de item ===')
      console.log('ID del item a eliminar:', itemId)

      // Intentar eliminar el item directamente
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('Error de Supabase al eliminar:', error)
        throw error
      }

      // Actualizar el estado local inmediatamente
      setItems(prevItems => prevItems.filter(item => item.id !== itemId))
      
      console.log('Item eliminado exitosamente')
      toast.success('Item eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar item:', error)
      toast.error('Error al eliminar el item')
    }
  }

  // Estadísticas generales
  const stats = useMemo(() => {
    const total = items.length
    const lowStock = items.filter(item => item.quantity <= item.min_stock).length

    return { total, lowStock }
  }, [items])

  // Obtener items con stock bajo
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.quantity <= item.min_stock)
  }, [items])

  // Calcular estado basado en la cantidad
  const calculateItemStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'out_of_stock';
    if (item.quantity <= item.min_stock) return 'low';
    return 'available';
  };

  // Filtrar y ordenar items
  const filteredItems = useMemo(() => {
    let result = [...items]

    // Aplicar filtro de estado
    if (filters.status !== 'all') {
      result = result.filter(item => {
        const currentStatus = calculateItemStatus(item);
        return currentStatus === filters.status;
      });
    }

    // Aplicar búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
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

    return result
  }, [items, sortConfig, filters, search])

  const handleModalSubmit = async (itemId: string, formData: any, type: 'use' | 'restock' | 'edit' | 'create') => {
    try {
      if (!selectedItem) {
        throw new Error('No se ha seleccionado ningún item');
      }

      await handleOperation(itemId, formData, type);
      
      // Recargar los datos del inventario
      await loadInventoryItems();
      
      // Cerrar el modal
      setIsModalOpen(false);
      
      // Limpiar el item seleccionado
      setSelectedItem(null);
    } catch (error) {
      console.error('Error en la operación:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la operación');
    }
  };

  const handleRestockClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('restock');
    setIsModalOpen(true);
  };

  const handleUseClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('use');
    setIsModalOpen(true);
  };

  const handleOperationsClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode('operations');
    setIsModalOpen(true);
  };

  // Actualizar el renderizado de la tabla para incluir los botones de uso y reposición
  const renderActionButtons = (item: InventoryItem) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleEditClick(item)}
        className="p-2 text-blue-600 hover:text-blue-800"
        title="Editar"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => handleOperationsClick(item)}
        className="p-2 text-green-600 hover:text-green-800"
        title="Operaciones"
      >
        <ArrowsUpDownIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => deleteInventoryItem(item.id)}
        className="p-2 text-red-600 hover:text-red-800"
        title="Eliminar"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setModalMode('edit');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
              <p className="mt-1 text-sm text-gray-500">Gestiona los items del inventario</p>
            </div>
            <button
              onClick={() => {
                setSelectedItem(null)
                setModalMode('create')
                setIsModalOpen(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium 
                       rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-blue-500 transition-all duration-200 shadow-sm"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Agregar Item
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                      <span className="text-sm text-gray-600">{item.name}: {item.quantity} unidades (Mínimo: {item.min_stock})</span>
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

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

          {/* Agregar contenedor con altura fija y scroll */}
          <div className="max-h-[600px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                {/* Hacer que el encabezado sea fijo */}
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {[
                      { key: 'name', label: 'Nombre', width: '30%' },
                      { key: 'quantity', label: 'Stock', width: '15%' },
                      { key: 'min_stock', label: 'Stock Mínimo', width: '15%' },
                      { key: 'status', label: 'Estado', width: '15%' },
                      { key: 'organization', label: 'Organización', width: '15%' },
                      { key: 'updated_at', label: 'Actualizado', width: '10%' },
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
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mr-2 ${
                            item.quantity > item.min_stock ? 'bg-green-400' :
                            item.quantity === 0 ? 'bg-red-400' : 'bg-yellow-400'
                          }`}></span>
                          <span className="text-sm text-gray-600">
                            {item.quantity} unidades
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.min_stock} unidades
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${calculateItemStatus(item) === 'available'
                            ? 'bg-green-100 text-green-800'
                            : calculateItemStatus(item) === 'out_of_stock'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {calculateItemStatus(item) === 'available' ? 'Disponible' :
                           calculateItemStatus(item) === 'out_of_stock' ? 'Sin Stock' : 'Stock Bajo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.organization?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {renderActionButtons(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={(itemId, formData, type) => handleModalSubmit(itemId, formData, type)}
        item={selectedItem}
        mode={modalMode}
      />
    </div>
  )
}