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
  hidePercentage?: boolean
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
  mode = 'edit',
  hidePercentage = false
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
  const loadHistory = async (forceRefresh = false) => {
    if (!item) return
  
    console.log('==================== INICIO CARGA DE HISTORIAL ====================');
    console.log(`Cargando historial para item ID: ${item.id}, Nombre: ${item.name}`);
    console.log(`Forzar refresco: ${forceRefresh ? 'SÍ' : 'NO'}`);
    
    setLoadingHistory(true);
    
    try {
      // Añadir timestamp para evitar caché en caso de forzar refresco
      const timestamp = new Date().getTime();

      // IMPORTANTE: Primero vaciamos los historiales para evitar datos obsoletos
      setRestockHistory([]);
      setUsageHistory([]);
      
      // PASO 1: Cargar historial de REPOSICIÓN - USANDO API ENDPOINT PARA EVITAR CACHÉ
      console.log(`[${timestamp}] Consultando historial de REPOSICIÓN...`);
      
      try {
        // Usar el endpoint API para evitar problemas de caché
        const response = await fetch(`/api/inventory/restock?id=${item.id}&t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error en la respuesta API: ${response.status}`);
        }
        
        const restockData = await response.json();
        
        console.log(`✅ Historial de REPOSICIÓN cargado desde API: ${restockData?.length || 0} registros`);
        
        if (restockData && restockData.length > 0) {
          console.log('DETALLE DE REGISTROS DE REPOSICIÓN:');
          restockData.forEach((record: any, index: number) => {
            console.log(`Reposición #${index + 1}:`, {
              id: record.id,
              inventory_id: record.inventory_id,
              quantity: record.quantity,
              supplier: record.supplier,
              date: record.date,
              created_at: record.created_at,
              updated_at: record.updated_at
            });
          });
          
          // Actualizar el estado con los datos
          setRestockHistory(restockData);
        } else {
          console.log('No hay registros de reposición para mostrar desde API.');
          
          // Fallback a consulta directa si la API no devuelve datos
          console.log('Intentando consulta directa como fallback...');
          const { data: fallbackData } = await supabase
            .from('inventory_restock')
            .select('*')
            .eq('inventory_id', item.id)
            .order('created_at', { ascending: false });
            
          if (fallbackData && fallbackData.length > 0) {
            console.log('Consulta directa encontró registros:', fallbackData.length);
            setRestockHistory(fallbackData);
          } else {
            console.log('No se encontraron registros de reposición en ninguna consulta.');
          }
        }
      } catch (apiError) {
        console.error('Error al usar API para reposiciones:', apiError);
        
        // Fallback a consulta directa si la API falla
        console.log('API falló, usando consulta directa...');
        const { data: restockData, error: restockError } = await supabase
          .from('inventory_restock')
          .select('*')
          .eq('inventory_id', item.id)
          .order('created_at', { ascending: false });

        if (restockError) {
          console.error('❌ Error al cargar historial de reposición:', restockError);
          toast.error('Error al cargar historial de reposición');
        } else if (restockData && restockData.length > 0) {
          console.log(`Historial de reposición cargado directamente: ${restockData.length} registros`);
          setRestockHistory(restockData);
        }
      }

      // Breve pausa entre consultas
      await new Promise(resolve => setTimeout(resolve, 100));

      // PASO 2: Cargar historial de USO
      console.log(`[${timestamp}] Consultando historial de USO...`);
      
      const { data: usageData, error: usageError } = await supabase
        .from('inventory_usage')
        .select('*')
        .eq('inventory_id', item.id)
        .order('created_at', { ascending: false });

      if (usageError) {
        console.error('❌ Error al cargar historial de uso:', usageError);
        toast.error('Error al cargar historial de uso');
      } else {
        console.log(`✅ Historial de USO cargado: ${usageData?.length || 0} registros`);
        
        if (usageData && usageData.length > 0) {
          console.log('DETALLE DE REGISTROS DE USO:');
          usageData.forEach((record, index) => {
            console.log(`Uso #${index + 1}:`, {
              id: record.id,
              inventory_id: record.inventory_id,
              quantity: record.quantity,
              user_name: record.user_name,
              date: record.date,
              created_at: record.created_at
            });
          });
          
          setUsageHistory(usageData);
        } else {
          console.log('No hay registros de uso para mostrar.');
        }
      }
      
      // PASO 3: Verificación adicional directa de la base de datos (para depuración)
      if (forceRefresh) {
        console.log('VERIFICACIÓN ADICIONAL de registros para depuración:');
        
        // Verificar específicamente registros de reposición para este ítem
        const { data: directCheckRestock, error: directCheckRestockError } = await supabase
          .from('inventory_restock')
          .select('count')
          .eq('inventory_id', item.id);
          
        if (directCheckRestockError) {
          console.error('Error en verificación directa de reposiciones:', directCheckRestockError);
        } else {
          console.log('Conteo directo de reposiciones:', directCheckRestock);
          
          // Si el conteo muestra registros pero no se cargaron en el estado, hacer otra consulta
          if (directCheckRestock[0]?.count > 0 && restockHistory.length === 0) {
            console.log('⚠️ Detectada discrepancia en reposiciones - intentando recarga forzada');
            
            // Consulta con timestamp para evitar caché
            const { data: retry } = await supabase
              .from('inventory_restock')
              .select('*')
              .eq('inventory_id', item.id)
              .order('created_at', { ascending: false });
              
            if (retry && retry.length > 0) {
              console.log('Reintento exitoso - actualizando estado con datos recuperados:', retry.length);
              setRestockHistory(retry);
            }
          }
        }
        
        // Verificar específicamente registros de uso para este ítem
        const { data: directCheckUsage, error: directCheckUsageError } = await supabase
          .from('inventory_usage')
          .select('count')
          .eq('inventory_id', item.id);
          
        if (directCheckUsageError) {
          console.error('Error en verificación directa de usos:', directCheckUsageError);
        } else {
          console.log('Conteo directo de usos:', directCheckUsage);
        }
      }
      
      console.log('==================== FIN CARGA DE HISTORIAL ====================');
    } catch (error) {
      console.error('Error general al cargar historial:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoadingHistory(false);
      console.log('Carga de historial finalizada');
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
        // Establecer la pestaña activa según el modo
        setActiveTab(mode);
        // Cargar el historial
        loadHistory();
      }
    }
  }, [isOpen, item, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Iniciando handleSubmit en InventoryModal:', { mode, activeTab, formData })
    
    try {
      // El modo (edit, create, use, restock) determina la operación principal
      // Pero para uso y reposición, la pestaña activa (activeTab) determina el tipo específico
      if (mode === 'use' || mode === 'restock') {
        // Usamos activeTab en lugar de mode para determinar el tipo de operación
        // Esto permite que el usuario cambie entre uso y reposición dentro del modal
        const currentOperation = activeTab === 'use' || activeTab === 'restock' ? activeTab : mode;
        
        console.log('Validando datos del formulario:', {
          operationQuantity: formData.operationQuantity,
          date: formData.date,
          userName: formData.userName,
          itemStock: item?.quantity,
          mode: mode,
          activeTab: activeTab,
          operation: currentOperation // Operación que realmente se ejecutará
        })

        // Validaciones básicas
        if (!formData.operationQuantity || formData.operationQuantity <= 0) {
          console.log('Error: Cantidad inválida')
          toast.error('La cantidad debe ser mayor a 0')
          return
        }
        
        // Solo validar el stock disponible si es una operación de uso
        if (currentOperation === 'use' && item && formData.operationQuantity > item.quantity) {
          console.log('Error: Cantidad excede el stock disponible')
          toast.error('La cantidad no puede ser mayor al stock disponible')
          return
        }

        if (!formData.date) {
          console.log('Error: Fecha no especificada')
          toast.error('La fecha es requerida')
          return
        }

        if (!formData.userName) {
          console.log('Error: Nombre no especificado')
          toast.error(`El nombre del ${currentOperation === 'use' ? 'usuario' : 'proveedor'} es requerido`)
          return
        }

        const dataToSubmit = {
          operationQuantity: formData.operationQuantity,
          date: formData.date,
          userName: formData.userName || '',
          operation: currentOperation // Añadir el tipo de operación a los datos
        }

        console.log('Enviando datos al servidor:', dataToSubmit)

        try {
          // Mostrar mensaje de procesamiento
          const loadingToast = toast.loading('Procesando operación...')
          
          // Llamar a la función que procesa la operación
          const result = await onSubmit(dataToSubmit)
          console.log('Datos enviados exitosamente, resultado:', result)
          
          // Cerrar el toast de carga
          toast.dismiss(loadingToast)
          toast.success(`Operación completada: ${currentOperation === 'use' ? 'Uso registrado' : 'Reposición completada'}`)
          
          // Limpiar formulario
          setFormData({
            operationQuantity: 0,
            date: new Date().toISOString().split('T')[0],
            userName: ''
          })

          // Sincronizar el comportamiento para AMBAS operaciones (uso y reposición)
          console.log(`Procesando finalización de operación: ${currentOperation}`);
          
          // IMPORTANTE: Para reposiciones, damos un poco más de tiempo para que la BD procese
          if (currentOperation === 'restock') {
            toast.loading('Actualizando historial...', { id: 'historyUpdate' });
            
            // Esperar un poco más para reposiciones
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Limpiar los historiales antes de recargar
            setRestockHistory([]);
            
            // Intentar cargar el historial varias veces para reposiciones
            console.log('Cargando historial de reposición (intento 1)...');
            await loadHistory(true);
            
            // Verificar si se cargaron datos
            if (restockHistory.length === 0) {
              console.log('No se encontraron registros en el primer intento, reintentando...');
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Segundo intento
              console.log('Cargando historial de reposición (intento 2)...');
              await loadHistory(true);
            }
            
            toast.dismiss('historyUpdate');
          } else {
            // Para uso, el tiempo estándar es suficiente
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadHistory(true);
          }
          
          // Mostrar la pestaña de historial en ambos casos
          setActiveTab('history');
          
          // No cerramos el modal automáticamente en ninguno de los dos casos
          // para que el usuario pueda ver el historial actualizado
          toast.success('Historial actualizado con la operación', { duration: 3000 });
        } catch (submitError: any) {
          console.error('Error al enviar datos:', submitError)
          toast.dismiss() // Cerrar el toast de carga
          toast.error(`Error: ${submitError?.message || 'Error al procesar operación'}`)
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
            {mode === 'edit' ? 'Editar Item' : 
             mode === 'create' ? 'Crear Item' : 
             activeTab === 'use' ? 'Registrar Uso' : 
             activeTab === 'restock' ? 'Registrar Reposición' : 
             activeTab === 'history' ? (item ? `Historial: ${item.name}` : 'Historial de Item') :
             'Operación de Inventario'}
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
                                        {record.user_name || record.user_id || 'Usuario'}
                                      </span>
                                      <span className="text-red-600">-{record.quantity} unidades</span>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                      {new Date(record.date).toLocaleDateString()} ({new Date(record.created_at).toLocaleTimeString()})
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
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium text-gray-900">Historial de Reposición</h3>
                            <button 
                              onClick={() => {
                                console.log('Recargando historial manualmente...');
                                loadHistory();
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              type="button"
                            >
                              Recargar
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {restockHistory.length > 0 ? (
                              <div className="space-y-2">
                                {restockHistory.map((record, index) => (
                                  <div key={index} className="bg-gray-50 p-2 rounded-lg text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{record.supplier || 'Proveedor'}</span>
                                      <span className="text-green-600">+{record.quantity} unidades</span>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                      {new Date(record.date).toLocaleDateString()} 
                                      {record.created_at && ` (${new Date(record.created_at).toLocaleTimeString()})`}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-1 truncate">
                                      ID: {record.id?.substring(0, 8)}...
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