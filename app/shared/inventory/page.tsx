'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import InventoryModal from './components/InventoryModal'

interface InventoryItem {
  id: number
  name: string
  category: string
  stock: number
  stock_min: number
  location: string
  status: string
  last_updated: string
  unit: string
  estimated_duration: number
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas las categorías')
  const [statusFilter, setStatusFilter] = useState('Todos los estados')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'restock' | 'use'>('create')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  // Cargar items del inventario
  useEffect(() => {
    loadInventoryItems()
  }, [])

  const loadInventoryItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name')

      if (error) throw error

      setItems(data || [])
    } catch (error) {
      console.error('Error loading inventory items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (mode: 'create' | 'edit' | 'restock' | 'use', item?: InventoryItem) => {
    setModalMode(mode)
    setSelectedItem(item || null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedItem(null)
  }

  const handleSubmitModal = async (formData: any) => {
    try {
      switch (modalMode) {
        case 'create':
          console.log('Intentando crear item:', formData)
          const { data: newItem, error: createError } = await supabase
            .from('inventory')
            .insert([{
              name: formData.name,
              category: formData.category,
              stock: 0,
              stock_min: formData.stock_min,
              location: formData.location,
              status: 'Sin Stock',
              unit: formData.unit,
              estimated_duration: formData.estimated_duration,
              last_updated: new Date().toISOString()
            }])
            .select()
            .single()

          if (createError) {
            console.error('Error detallado:', createError)
            throw createError
          }

          console.log('Item creado:', newItem)
          setItems([...items, newItem])
          break

        case 'edit':
          if (!selectedItem) return

          const { error: updateError } = await supabase
            .from('inventory')
            .update({
              name: formData.name,
              category: formData.category,
              stock_min: formData.stock_min,
              location: formData.location,
              unit: formData.unit,
              estimated_duration: formData.estimated_duration,
              last_updated: new Date().toISOString()
            })
            .eq('id', selectedItem.id)

          if (updateError) throw updateError
          await loadInventoryItems()
          break

        case 'restock':
          if (!selectedItem) return

          const newStock = selectedItem.stock + formData.quantity
          const newStatus = newStock > selectedItem.stock_min ? 'Disponible' : 
                          newStock === 0 ? 'Sin Stock' : 'Bajo Stock'

          const { error: restockError } = await supabase
            .from('inventory')
            .update({
              stock: newStock,
              status: newStatus,
              last_updated: new Date().toISOString()
            })
            .eq('id', selectedItem.id)

          if (restockError) throw restockError
          await loadInventoryItems()
          break

        case 'use':
          if (!selectedItem) return

          const remainingStock = selectedItem.stock - formData.quantity
          if (remainingStock < 0) {
            alert('No hay suficiente stock disponible')
            return
          }

          const status = remainingStock > selectedItem.stock_min ? 'Disponible' : 
                        remainingStock === 0 ? 'Sin Stock' : 'Bajo Stock'

          const { error: useError } = await supabase
            .from('inventory')
            .update({
              stock: remainingStock,
              status: status,
              last_updated: new Date().toISOString()
            })
            .eq('id', selectedItem.id)

          if (useError) throw useError
          await loadInventoryItems()
          break
      }

      handleCloseModal()
    } catch (error) {
      console.error('Error handling inventory operation:', error)
      alert('Ocurrió un error al procesar la operación')
    }
  }

  // Filtrar items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = 
      categoryFilter === 'Todas las categorías' || 
      item.category === categoryFilter

    const matchesStatus = 
      statusFilter === 'Todos los estados' || 
      item.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Calcular estadísticas
  const stats = {
    totalItems: items.length,
    criticalItems: items.filter(item => item.stock <= item.stock_min).length,
    locations: new Set(items.map(item => item.location)).size
  }

  // Obtener items críticos
  const criticalItems = items
    .filter(item => item.stock <= item.stock_min)
    .map(item => ({
      name: item.name,
      quantity: item.stock,
      unit: item.unit,
      minStock: item.stock_min
    }))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
        <button 
          onClick={() => handleOpenModal('create')}
          className="bg-[#4263eb] hover:bg-[#364fc7] text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span>
          Agregar Item
        </button>
      </div>

      {/* Alerta de Stock Crítico */}
      {criticalItems.length > 0 && (
        <div className="bg-[#fff9db] border border-[#f08c00] rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-[#f08c00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-[#f08c00] font-medium">
                Hay {criticalItems.length} items con stock crítico
              </h3>
              <div className="mt-2">
                {criticalItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-[#f08c00] mb-1">
                    <span>{item.name}: {item.quantity} {item.unit} (Crítico: {item.minStock})</span>
                    <button 
                      onClick={() => {
                        const fullItem = items.find(i => i.name === item.name)
                        if (fullItem) handleOpenModal('restock', fullItem)
                      }}
                      className="text-[#4263eb] hover:text-[#364fc7] font-medium"
                    >
                      Reponer
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button className="ml-4 text-gray-400 hover:text-gray-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Cards de Resumen */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
          <p className="mt-2 text-3xl font-semibold text-[#4263eb]">{stats.totalItems}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Items en Estado Crítico</h3>
          <p className="mt-2 text-3xl font-semibold text-[#f08c00]">{stats.criticalItems}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Ubicaciones</h3>
          <p className="mt-2 text-3xl font-semibold text-[#2f9e44]">{stats.locations}</p>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestión de Inventario</h2>
          
          <div className="flex justify-between items-center mb-6">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar por nombre, categoría o ubicación"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleOpenModal('create')}
                className="bg-[#4263eb] text-white px-4 py-2 rounded-lg hover:bg-[#364fc7]"
              >
                Nuevo Item
              </button>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option>Todas las categorías</option>
                <option>Limpieza</option>
                <option>Seguridad</option>
                <option>Herramientas</option>
                <option>Químicos</option>
              </select>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>Todos los estados</option>
                <option>Disponible</option>
                <option>Bajo Stock</option>
                <option>Sin Stock</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre ↑
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actualización
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-500">
                      No se encontraron items
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {item.stock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {item.stock_min} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{item.location}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'Disponible' ? 'bg-green-100 text-green-800' :
                          item.status === 'Bajo Stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(item.last_updated).toLocaleString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-right space-x-3">
                        <button 
                          onClick={() => handleOpenModal('edit', item)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleOpenModal('use', item)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleOpenModal('restock', item)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <InventoryModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        mode={modalMode}
        item={selectedItem}
      />
    </div>
  )
} 