'use client'
import { useState, useEffect } from 'react'

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

interface InventoryFormData {
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  location: string
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

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ModalFormData) => void
  item?: InventoryItem
  mode: 'edit' | 'usage' | 'restock'
}

export default function InventoryModal({ isOpen, onClose, onSubmit, item, mode }: InventoryModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryFormData & UsageFormData & RestockFormData>>({
    name: '',
    category: 'cleaning',
    quantity: 0,
    unit: 'unidades',
    minStock: 0,
    location: '',
    operationQuantity: 0,
    user: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (item) {
      if (mode === 'edit') {
        setFormData({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          minStock: item.minStock,
          location: item.location
        })
      } else {
        setFormData({
          operationQuantity: 0,
          user: '',
          supplier: '',
          date: new Date().toISOString().split('T')[0]
        })
      }
    }
  }, [item, mode])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let submittedData: ModalFormData

    switch (mode) {
      case 'usage':
        submittedData = {
          operationQuantity: formData.operationQuantity || 0,
          date: formData.date || new Date().toISOString().split('T')[0],
          user: formData.user || ''
        }
        break
      case 'restock':
        submittedData = {
          operationQuantity: formData.operationQuantity || 0,
          date: formData.date || new Date().toISOString().split('T')[0],
          supplier: formData.supplier || ''
        }
        break
      default:
        submittedData = {
          name: formData.name || '',
          category: formData.category || 'cleaning',
          quantity: formData.quantity || 0,
          unit: formData.unit || 'unidades',
          minStock: formData.minStock || 0,
          location: formData.location || ''
        }
    }

    onSubmit(submittedData)
    onClose()
  }

  const getTitle = () => {
    switch (mode) {
      case 'usage':
        return 'Registrar Uso'
      case 'restock':
        return 'Registrar Reposición'
      default:
        return item ? 'Editar Item' : 'Nuevo Item'
    }
  }

  const renderForm = () => {
    switch (mode) {
      case 'usage':
        return (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Cantidad a Usar</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.operationQuantity}
                onChange={e => setFormData(prev => ({ ...prev, operationQuantity: Number(e.target.value) }))}
                min="1"
                max={item?.quantity || 0}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Usuario</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.user}
                onChange={e => setFormData(prev => ({ ...prev, user: e.target.value }))}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Fecha</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </>
        )
      
      case 'restock':
        return (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Cantidad a Reponer</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.operationQuantity}
                onChange={e => setFormData(prev => ({ ...prev, operationQuantity: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Proveedor</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.supplier}
                onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Fecha</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </>
        )
      
      default:
        return (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nombre</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Categoría</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="cleaning">Limpieza</option>
                <option value="tools">Herramientas</option>
                <option value="chemicals">Químicos</option>
                <option value="safety">Seguridad</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Cantidad</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  min="0"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Unidad</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData.unit}
                  onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Stock Mínimo</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.minStock}
                onChange={e => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                min="0"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Ubicación</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {getTitle()}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderForm()}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {mode === 'usage' ? 'Registrar Uso' : 
               mode === 'restock' ? 'Registrar Reposición' : 
               item ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
