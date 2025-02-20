'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import type { InventoryItem } from '../types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { inventoryService } from '@/app/services/inventoryService'

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, data: any, type: 'use' | 'restock' | 'edit' | 'create') => Promise<void>;
  item: InventoryItem | null;
  mode: 'use' | 'restock' | 'operations' | 'edit' | 'create';
}

interface FormData {
  quantity: number;
  date: string;
  user_name: string;
}

export default function InventoryModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  mode
}: InventoryModalProps) {
  const [formData, setFormData] = useState<FormData>({
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    user_name: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    min_stock: 0,
    unit: 'unidades'
  });

  const [activeTab, setActiveTab] = useState<'use' | 'restock' | 'history'>(mode === 'operations' ? 'use' : 'use');
  const [combinedHistory, setCombinedHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (mode === 'use') {
      setActiveTab('use');
    } else if (mode === 'restock') {
      setActiveTab('restock');
    } else if (mode === 'operations') {
      setActiveTab('use');
    }
  }, [mode, isOpen]);

  useEffect(() => {
    if (item && isOpen) {
      if (mode === 'edit') {
        setEditFormData({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          min_stock: item.min_stock,
          unit: item.unit
        });
      } else {
        setFormData({
          quantity: 0,
          date: new Date().toISOString().split('T')[0],
          user_name: ''
        });
      }
      loadHistory();
    }
  }, [item, isOpen, mode]);

  // Función para cargar el historial
  const loadHistory = async () => {
    if (!item) return;
    
    setLoadingHistory(true);
    try {
      const historyData = await inventoryService.getCombinedHistory(item.id);
      setCombinedHistory(historyData || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const quantity = Number(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('La cantidad debe ser mayor a 0');
        return;
      }

      const operationData = {
        quantity: quantity,
        date: formData.date,
        supplier: activeTab === 'restock' ? formData.user_name : undefined,
        user_name: formData.user_name,
        user_id: user.id,
        organization_id: item.organization_id
      };

      // Solo enviar si es una operación de uso o reposición
      if (activeTab === 'use' || activeTab === 'restock') {
        await onSubmit(item.id, operationData, activeTab);
      }
      
      // Cambiar a la pestaña de historial después de la operación
      setActiveTab('history');
      
      // Limpiar el formulario
      setFormData({
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
        user_name: ''
      });
      
      // Recargar el historial
      await loadHistory();
      
      toast.success(`${activeTab === 'use' ? 'Uso' : 'Reposición'} registrado correctamente`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la operación');
    }
  };

  const handleClose = () => {
    // Limpiar los estados antes de cerrar
    setFormData({
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
      user_name: ''
    });
    setEditFormData({
      name: '',
      description: '',
      quantity: 0,
      min_stock: 0,
      unit: 'unidades'
    });
    setActiveTab('use');
    onClose();
  };

  const renderHistorySection = () => {
    if (loadingHistory) {
      return (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Agrupar registros por fecha
    const groupedHistory = combinedHistory.reduce((groups, record) => {
      const date = new Date(record.date).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {});

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Historial de Movimientos</h3>
          <div className="h-[calc(100vh-520px)] overflow-y-auto bg-gray-50/50 rounded-lg p-4">
            {combinedHistory.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedHistory).reverse().map(([date, records]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex justify-center">
                      <span className="bg-white shadow-sm text-gray-600 text-xs px-3 py-1 rounded-full border border-gray-100">
                        {new Date(date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(records as any[])
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((record) => (
                          <div 
                            key={record.id} 
                            className={`flex ${record.type === 'use' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                          >
                            {record.type === 'restock' && (
                              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            )}
                            <div 
                              className={`
                                max-w-[70%] rounded-2xl px-4 py-2 shadow-sm
                                ${record.type === 'use' 
                                  ? 'bg-rose-50 text-gray-900 rounded-br-none border border-rose-100/50' 
                                  : 'bg-emerald-50 text-gray-900 rounded-bl-none border border-emerald-100/50'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  {record.type === 'use' ? record.user_name : record.supplier}
                                </span>
                                <span className={`font-semibold ${record.type === 'use' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {record.type === 'use' ? `-${record.quantity}` : `+${record.quantity}`} {item?.unit || 'unidades'}
                                </span>
                              </div>
                              <div className={`text-xs mt-1 ${record.type === 'use' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {record.type === 'use' && (
                              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No hay registros de movimientos</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Resumen de Inventario</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-600 font-medium mb-1">Stock Actual</p>
              <p className="text-2xl font-bold text-gray-900">{item?.quantity}</p>
              <p className="text-xs text-gray-500">{item?.unit || 'unidades'}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-600 font-medium mb-1">Stock Mínimo</p>
              <p className="text-2xl font-bold text-gray-900">{item?.min_stock}</p>
              <p className="text-xs text-gray-500">{item?.unit || 'unidades'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOperationForm = () => {
    const isUseOperation = activeTab === 'use';
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad a {isUseOperation ? 'Usar' : 'Reponer'}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={isUseOperation ? item?.quantity : undefined}
              value={formData.quantity || ''}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="flex-1 p-2 border rounded-lg"
              required
            />
            <span className="text-gray-500">{item?.unit || 'unidades'}</span>
          </div>
          {isUseOperation && (
            <p className="text-sm text-gray-500 mt-1">
              Stock disponible: {item?.quantity} {item?.unit || 'unidades'}
            </p>
          )}
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

        {activeTab === 'restock' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Nombre del proveedor"
              required
            />
          </div>
        )}

        {activeTab === 'use' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Nombre del usuario"
              required
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {isUseOperation ? 'Registrar Uso' : 'Registrar Reposición'}
          </button>
        </div>
      </form>
    );
  };

  if (mode === 'edit' && item) {
    return (
      <Dialog
        open={isOpen}
        onClose={handleClose}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Item
              </h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              onSubmit(item.id, editFormData, 'edit');
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={editFormData.min_stock}
                  onChange={(e) => setEditFormData({ ...editFormData, min_stock: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <input
                  type="text"
                  value={editFormData.unit}
                  onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  if (!isOpen || !item) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {item?.name}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <button
                onClick={() => setActiveTab('use')}
                className={`flex-1 py-2 px-4 text-center rounded-lg transition-colors ${
                  activeTab === 'use' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Registrar Uso
              </button>
              <button
                onClick={() => setActiveTab('restock')}
                className={`flex-1 py-2 px-4 text-center rounded-lg transition-colors ${
                  activeTab === 'restock' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Registrar Reposición
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 px-4 text-center rounded-lg transition-colors ${
                  activeTab === 'history' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Historial
              </button>
            </div>

            {activeTab === 'history' ? renderHistorySection() : renderOperationForm()}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}