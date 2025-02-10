'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import type { InventoryItem } from '../types'

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  item?: InventoryItem
  mode: 'edit' | 'use' | 'restock' | 'create'
}

export default function InventoryModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  mode
}: InventoryModalProps) {
  const [activeTab, setActiveTab] = useState<'use' | 'restock'>('use')
  const [formData, setFormData] = useState({
    quantity: 0,
    user: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    min_stock: 0,
    unit: 'unidades'
  })

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && item) {
        setEditFormData({
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          min_stock: item.min_stock || 0,
          unit: item.unit || 'unidades'
        })
      } else if (mode === 'use') {
        setFormData({
          quantity: 0,
          user: '',
          date: new Date().toISOString().split('T')[0]
        })
        setActiveTab('use')
      }
    }
  }, [isOpen, item, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'use') {
      if (activeTab === 'use') {
        if (!formData.quantity || formData.quantity <= 0) {
          toast.error('La cantidad debe ser mayor a 0')
          return
        }
        
        if (item && formData.quantity > item.quantity) {
          toast.error('La cantidad no puede ser mayor al stock disponible')
          return
        }
      }
      onSubmit({ ...formData, type: activeTab })
    } else if (mode === 'edit' || mode === 'create') {
      onSubmit(editFormData)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium">
              {mode === 'edit' ? 'Editar Item' : 
               mode === 'create' ? 'Crear Nuevo Item' : 
               'Gestionar Stock'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {(mode === 'edit' || mode === 'create') ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                           focus:ring-blue-500 sm:text-sm"
                  placeholder="Nombre del item"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                           focus:ring-blue-500 sm:text-sm"
                  placeholder="Descripción del item"
                  rows={3}
                />
              </div>

              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantidad Inicial</label>
                  <input
                    type="number"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      quantity: Number(e.target.value)
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                             focus:ring-blue-500 sm:text-sm"
                    min="0"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                <input
                  type="number"
                  value={editFormData.min_stock}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    min_stock: Number(e.target.value)
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                           focus:ring-blue-500 sm:text-sm"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                <input
                  type="text"
                  value={editFormData.unit}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                           focus:ring-blue-500 sm:text-sm"
                  placeholder="Ej: unidades, kg, litros"
                  required
                />
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {mode === 'create' ? 'Crear Item' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <button
                    onClick={() => setActiveTab('use')}
                    className={`flex-1 py-2 px-4 text-center ${
                      activeTab === 'use' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Registrar Uso
                  </button>
                  <button
                    onClick={() => setActiveTab('restock')}
                    className={`flex-1 py-2 px-4 text-center ${
                      activeTab === 'restock' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Registrar Reposición
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'use' ? 'Cantidad a Usar' : 'Cantidad a Reponer'}
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="0"
                      min="0"
                      required
                    />
                    <span className="text-sm text-gray-500 mt-1">{item?.unit || 'unidades'}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'use' ? 'Usuario' : 'Proveedor'}
                    </label>
                    <input
                      type="text"
                      value={formData.user}
                      onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {activeTab === 'use' ? 'Registrar Uso' : 'Registrar Reposición'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
} 