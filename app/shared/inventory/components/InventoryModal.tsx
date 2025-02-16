'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import type { InventoryItem } from '../types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  item?: InventoryItem
  mode: 'edit' | 'use' | 'restock' | 'create'
}

interface FormData {
  operationQuantity: number;
  date: string;
  userName: string;
}

export default function InventoryModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  mode
}: InventoryModalProps) {
  const [formData, setFormData] = useState<FormData>({
    operationQuantity: 0,
    date: new Date().toISOString().split('T')[0],
    userName: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    min_stock: 0,
    unit: 'unidades'
  });

  const [activeTab, setActiveTab] = useState<'use' | 'restock' | 'history'>('use');
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [restockHistory, setRestockHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false)
  const supabase = createClientComponentClient()

  // Función para cargar el historial
  const loadHistory = async () => {
    if (!item) return
    
    setLoadingHistory(true)
    try {
      // Cargar historial de uso
      const { data: usageData } = await supabase
        .from('inventory_usage')
        .select(`
          quantity,
          date,
          user_name
        `)
        .eq('inventory_id', item.id)
        .order('date', { ascending: false })

      // Cargar historial de reposición
      const { data: restockData } = await supabase
        .from('inventory_restock')
        .select(`
          quantity,
          date,
          supplier
        `)
        .eq('inventory_id', item.id)
        .order('date', { ascending: false })

      setUsageHistory(usageData || [])
      setRestockHistory(restockData || [])
    } catch (error) {
      console.error('Error al cargar historial:', error)
      toast.error('Error al cargar el historial')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      console.log('Modal abierto:', { mode, item })
      // Resetear el formulario cuando se abre el modal
      setFormData({
        operationQuantity: 0,
        date: new Date().toISOString().split('T')[0],
        userName: ''
      });

      if (mode === 'edit' && item) {
        setEditFormData({
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          min_stock: item.min_stock || 0,
          unit: item.unit || 'unidades'
        });
      } else if (mode === 'use' || mode === 'restock') {
        setActiveTab(mode);
        loadHistory();
      }
    }
  }, [isOpen, item, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Iniciando handleSubmit:', { mode, activeTab, formData })
    
    try {
      if (mode === 'use' || mode === 'restock') {
        console.log('Validando datos del formulario:', {
          operationQuantity: formData.operationQuantity,
          date: formData.date,
          itemStock: item?.quantity,
          mode: mode
        })

        // Validaciones básicas
        if (!formData.operationQuantity || formData.operationQuantity <= 0) {
          console.log('Error: Cantidad inválida')
          toast.error('La cantidad debe ser mayor a 0')
          return
        }
        
        // Solo validar el stock disponible si es una operación de uso
        if (activeTab === 'use' && item && formData.operationQuantity > item.quantity) {
          console.log('Error: Cantidad excede el stock disponible')
          toast.error('La cantidad no puede ser mayor al stock disponible')
          return
        }

        if (!formData.date) {
          console.log('Error: Fecha no especificada')
          toast.error('La fecha es requerida')
          return
        }

        const dataToSubmit = {
          operationQuantity: formData.operationQuantity,
          date: formData.date,
          userName: formData.userName || ''
        }

        console.log('Enviando datos al servidor:', dataToSubmit)

        try {
          await onSubmit(dataToSubmit)
          console.log('Datos enviados exitosamente')
          
          // Limpiar formulario y cerrar modal
          setFormData({
            operationQuantity: 0,
            date: new Date().toISOString().split('T')[0],
            userName: ''
          })
          onClose()
        } catch (submitError) {
          console.error('Error al enviar datos:', submitError)
          throw submitError
        }
      } else if (mode === 'edit' || mode === 'create') {
        console.log('Enviando datos de edición/creación:', editFormData)
        await onSubmit(editFormData)
        onClose()
      }
    } catch (error) {
      console.error('Error en el formulario:', error)
      toast.error('Error al procesar la operación')
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
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            {mode === 'edit' ? 'Editar Item' : mode === 'use' ? 'Registrar Uso' : 'Registrar Reposición'}
          </Dialog.Title>

          {mode === 'edit' || mode === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                           focus:ring-blue-500 sm:text-sm"
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
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 px-4 text-center ${
                      activeTab === 'history' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Historial
                  </button>
                </div>

                {activeTab === 'history' ? (
                  <div className="mt-4">
                    {loadingHistory ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Historial de Uso</h3>
                          <div className="max-h-48 overflow-y-auto">
                            {usageHistory.length > 0 ? (
                              <div className="space-y-2">
                                {usageHistory.map((record, index) => (
                                  <div key={index} className="bg-gray-50 p-2 rounded-lg text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">
                                        {record.user_name}
                                      </span>
                                      <span className="text-red-600">-{record.quantity} unidades</span>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                      {new Date(record.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm text-center py-2">No hay registros de uso</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Historial de Reposición</h3>
                          <div className="max-h-48 overflow-y-auto">
                            {restockHistory.length > 0 ? (
                              <div className="space-y-2">
                                {restockHistory.map((record, index) => (
                                  <div key={index} className="bg-gray-50 p-2 rounded-lg text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{record.supplier}</span>
                                      <span className="text-green-600">+{record.quantity} unidades</span>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                      {new Date(record.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm text-center py-2">No hay registros de reposición</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {activeTab === 'use' ? 'Cantidad a Usar' : 'Cantidad a Reponer'}
                      </label>
                      <input
                        type="number"
                        value={formData.operationQuantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, operationQuantity: value }));
                        }}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {activeTab === 'use' ? 'Nombre del Usuario' : 'Nombre del Proveedor'}
                      </label>
                      <input
                        type="text"
                        value={formData.userName}
                        onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={activeTab === 'use' ? 'Ej: Juan Pérez' : 'Ej: Proveedor ABC'}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {activeTab === 'use' ? 'Registrar Uso' : 'Registrar Reposición'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
} 