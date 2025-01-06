'use client'
import { useState, useEffect, useMemo } from 'react'

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  item?: InventoryItem
  mode: 'edit' | 'usage' | 'restock'
}

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

interface HistoryProps {
  usageHistory: UsageRecord[]
  restockHistory: RestockRecord[]
}

export default function InventoryModal({ isOpen, onClose, onSubmit, item, mode }: InventoryModalProps) {
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    category: 'cleaning',
    quantity: 0,
    unit: '',
    minStock: 0,
    location: '',
    estimatedDuration: 0
  })

  const [usageAmount, setUsageAmount] = useState(0)
  const [restockAmount, setRestockAmount] = useState(0)
  const [supplier, setSupplier] = useState('')
  const [user, setUser] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState<'usage' | 'restock'>('usage')

  // Lista de ubicaciones predefinidas
  const predefinedLocations = [
    'Almacén Principal',
    'Bodega A',
    'Bodega B',
    'Área de Limpieza',
    'Área de Herramientas',
    'Área de Seguridad'
  ]

  const [locations, setLocations] = useState<string[]>(() => {
    const savedLocations = localStorage.getItem('inventoryLocations')
    return savedLocations ? JSON.parse(savedLocations) : predefinedLocations
  })

  const [showNewLocation, setShowNewLocation] = useState(false)
  const [newLocation, setNewLocation] = useState('')

  // Función para agregar nueva ubicación
  const handleAddLocation = () => {
    if (newLocation && !locations.includes(newLocation)) {
      const updatedLocations = [...locations, newLocation]
      setLocations(updatedLocations)
      localStorage.setItem('inventoryLocations', JSON.stringify(updatedLocations))
      setFormData({ ...formData, location: newLocation })
      setNewLocation('')
      setShowNewLocation(false)
    }
  }

  // Actualizar formData cuando cambia el item
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        location: item.location,
        estimatedDuration: item.estimatedDuration
      })
    } else {
      // Resetear el formulario cuando es nuevo item
      setFormData({
        name: '',
        category: 'cleaning',
        quantity: 0,
        unit: '',
        minStock: 0,
        location: '',
        estimatedDuration: 0
      })
    }
  }, [item])

  // Cálculos de estadísticas usando JavaScript
  const stats = useMemo(() => {
    if (!item) return null

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const dailyStats = last7Days.map(date => {
      const usage = item.usageHistory
        .filter(record => {
          try {
            const recordDate = new Date(record.date).toISOString().split('T')[0]
            return recordDate === date
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            console.error('Error parsing date:', errorMessage)
            return false
          }
        })
        .reduce((sum, record) => sum + record.quantity, 0)
      
      const restock = item.restockHistory
        .filter(record => {
          try {
            const recordDate = new Date(record.date).toISOString().split('T')[0]
            return recordDate === date
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            console.error('Error parsing date:', errorMessage)
            return false
          }
        })
        .reduce((sum, record) => sum + record.quantity, 0)

      return {
        date: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
        usage,
        restock
      }
    })

    const totalUsage = item.usageHistory.reduce((sum, record) => sum + record.quantity, 0)
    const totalRestock = item.restockHistory.reduce((sum, record) => sum + record.quantity, 0)
    const stockPercentage = item.minStock > 0 ? Math.min((item.quantity / item.minStock) * 100, 100) : 100
    const maxDailyValue = Math.max(
      ...dailyStats.map(stat => Math.max(stat.usage, stat.restock)),
      1 // Asegurar que siempre hay un valor mínimo para evitar división por cero
    )

    return {
      dailyStats,
      totalUsage,
      totalRestock,
      stockPercentage,
      maxDailyValue
    }
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'usage' || mode === 'restock') {
      if (!item) return

      if (activeTab === 'usage') {
        // Validar que no quede stock negativo
        if (usageAmount > item.quantity) {
          alert('No hay suficiente stock disponible')
          return
        }

        const newUsageRecord: UsageRecord = {
          id: Date.now().toString(),
          quantity: usageAmount,
          date: selectedDate,
          user: user
        }

        const updatedQuantity = item.quantity - usageAmount
        const updatedItem: InventoryItem = {
          ...item,
          quantity: updatedQuantity,
          usageHistory: [newUsageRecord, ...item.usageHistory],
          lastUsed: new Date().toISOString(),
          status: updatedQuantity > item.minStock ? 'available' : 
                 updatedQuantity === 0 ? 'out_of_stock' : 'low'
        }

        onSubmit(updatedItem)
        setUsageAmount(0)
        setUser('')
        setSelectedDate(new Date().toISOString().split('T')[0])
      } else {
        const newRestockRecord: RestockRecord = {
          id: Date.now().toString(),
          quantity: restockAmount,
          date: selectedDate,
          supplier: supplier
        }

        const updatedQuantity = item.quantity + restockAmount
        const updatedItem: InventoryItem = {
          ...item,
          quantity: updatedQuantity,
          restockHistory: [newRestockRecord, ...item.restockHistory],
          lastUpdated: new Date().toISOString(),
          status: updatedQuantity > item.minStock ? 'available' : 
                 updatedQuantity === 0 ? 'out_of_stock' : 'low'
        }

        onSubmit(updatedItem)
        setRestockAmount(0)
        setSupplier('')
        setSelectedDate(new Date().toISOString().split('T')[0])
      }
    } else {
      onSubmit(formData)
    }
    
    onClose()
  }

  if (!isOpen) return null

  const renderLocationField = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Ubicación
      </label>
      {showNewLocation ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="input input-bordered flex-1"
              placeholder="Nueva ubicación"
              required
            />
            <button
              type="button"
              onClick={handleAddLocation}
              className="btn btn-primary"
            >
              Agregar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewLocation(false)
                setNewLocation('')
              }}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="select select-bordered flex-1"
            required
          >
            <option value="">Seleccionar ubicación</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewLocation(true)}
            className="btn btn-ghost"
            title="Agregar nueva ubicación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (mode) {
      case 'usage':
      case 'restock':
        return (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                className={`px-4 py-2 -mb-px text-sm font-medium ${
                  activeTab === 'usage'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('usage')}
              >
                Registrar Uso
              </button>
              <button
                type="button"
                className={`px-4 py-2 -mb-px text-sm font-medium ${
                  activeTab === 'restock'
                    ? 'text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('restock')}
              >
                Registrar Reposición
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Formulario */}
              <div className="space-y-4">
                {activeTab === 'usage' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad a Usar
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={usageAmount}
                          onChange={(e) => setUsageAmount(Number(e.target.value))}
                          min="1"
                          max={item?.quantity || 0}
                          className="input input-bordered w-full"
                          required
                        />
                        <div className="text-sm text-gray-500 flex items-center">
                          {item?.unit || 'unidades'}
                        </div>
                      </div>
                      {item && item.quantity <= item.minStock && (
                        <p className="text-yellow-600 text-sm mt-1">
                          ⚠️ Stock crítico: {item.quantity} {item.unit} (Nivel crítico: {item.minStock})
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario
                      </label>
                      <input
                        type="text"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad a Reponer
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={restockAmount}
                          onChange={(e) => setRestockAmount(Number(e.target.value))}
                          min="1"
                          className="input input-bordered w-full"
                          required
                        />
                        <div className="text-sm text-gray-500 flex items-center">
                          {item?.unit || 'unidades'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proveedor
                      </label>
                      <input
                        type="text"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {activeTab === 'usage' ? 'Registrar Uso' : 'Registrar Reposición'}
                  </button>
                </div>
              </div>

              {/* Historial */}
              <div className="border-l pl-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Movimientos</h3>
                <div className="overflow-y-auto max-h-[400px]">
                  {item && [...item.usageHistory, ...item.restockHistory]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => {
                      const isUsage = 'user' in record;
                      return (
                        <div
                          key={record.id}
                          className="mb-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isUsage ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isUsage ? 'Uso' : 'Reposición'}
                            </span>
                            <span className={`text-sm font-medium ${
                              isUsage ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {isUsage ? '-' : '+'}{record.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {isUsage ? `Usuario: ${record.user}` : `Proveedor: ${record.supplier}`}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {new Date(record.date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="cleaning">Limpieza</option>
                <option value="safety">Seguridad</option>
                <option value="tools">Herramientas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input input-bordered w-full"
                placeholder="ej: litros, cajas, galones"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Crítico
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                  min="0"
                  className="input input-bordered w-full"
                  required
                />
                <div className="text-sm text-gray-500 flex items-center">
                  {formData.unit || 'unidades'}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Se mostrará una alerta cuando el stock llegue a este nivel crítico
              </p>
            </div>

            {renderLocationField()}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración Estimada (días)
              </label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
                min="1"
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Agregar los botones de acción al final */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {item ? 'Guardar Cambios' : 'Crear Item'}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50">
      <div className="bg-white rounded-lg w-full max-w-[90%] md:max-w-[800px] my-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'usage' || mode === 'restock' ? 'Gestionar Stock' :
               item ? 'Editar Item' : 'Nuevo Item'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            {renderContent()}
          </form>
        </div>
      </div>
    </div>
  );
} 