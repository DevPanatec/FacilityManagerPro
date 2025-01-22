'use client'

import { useState, useEffect } from 'react'

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  mode: 'create' | 'edit' | 'restock' | 'use'
  item?: any
}

interface FormData {
  name: string
  category: string
  unit: string
  stock_min: number
  location: string
  estimated_duration: number
  quantity: number
}

export default function InventoryModal({ isOpen, onClose, onSubmit, mode, item }: InventoryModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    unit: '',
    stock_min: 0,
    location: '',
    estimated_duration: 0,
    quantity: 0
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        unit: item.unit || '',
        stock_min: item.stock_min || 0,
        location: item.location || '',
        estimated_duration: item.estimated_duration || 0,
        quantity: item.quantity || 0
      })
    }
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Nuevo Item' : 
             mode === 'edit' ? 'Editar Item' :
             mode === 'restock' ? 'Reponer Stock' : 'Usar Item'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {(mode === 'create' || mode === 'edit') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                  placeholder="Nombre del item"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Químicos">Químicos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                  placeholder="ej: litros, cajas, galones"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={formData.stock_min}
                    onChange={(e) => setFormData({ ...formData, stock_min: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                    min="0"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                  required
                >
                  <option value="">Seleccionar ubicación</option>
                  <option value="Almacén Principal">Almacén Principal</option>
                  <option value="Almacén Secundario">Almacén Secundario</option>
                  <option value="Bodega">Bodega</option>
                  <option value="Área de Producción">Área de Producción</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración Estimada (días)</label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                  min="0"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tiempo estimado que durará el stock antes de necesitar reposición
                </p>
              </div>
            </>
          )}

          {mode === 'restock' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Reponer</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                  min="1"
                  required
                />
                <div className="text-sm text-gray-500 flex items-center">
                  {item?.unit || 'unidades'}
                </div>
              </div>
            </div>
          )}

          {mode === 'use' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Usar</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                  min="1"
                  max={item?.quantity || 0}
                  required
                />
                <div className="text-sm text-gray-500 flex items-center">
                  {item?.unit || 'unidades'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-[#4263eb] rounded-lg hover:bg-[#3451c7]"
          >
            {mode === 'create' ? 'Crear' : 
             mode === 'edit' ? 'Guardar' :
             mode === 'restock' ? 'Reponer' : 'Usar'}
          </button>
        </div>
      </form>
    </div>
  )
} 