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
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<'edit' | 'use' | 'restock' | 'create'>('edit')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAlerts, setShowAlerts] = useState(true)
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  // Función para diagnosticar problemas de conexión con las tablas
  const runDiagnosis = async () => {
    try {
      setDiagnosisResult('Iniciando diagnóstico de tablas de inventario...');
      console.log('🔍 Diagnóstico de tablas de inventario');
      
      // 1. Verificar tabla inventory_items
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_items')
        .select('id, name')
        .limit(1);
      
      console.log('Tabla inventory_items:', itemsError ? 'ERROR' : 'OK', itemsData);
      
      if (itemsError) {
        setDiagnosisResult(`Error en tabla inventory_items: ${itemsError.message}`);
        console.error('Error en tabla inventory_items:', itemsError);
        return;
      }
      
      // 2. Verificar tabla inventory_usage
      const { data: usageData, error: usageError } = await supabase
        .from('inventory_usage')
        .select('id, inventory_id')
        .limit(1);
      
      console.log('Tabla inventory_usage:', usageError ? 'ERROR' : 'OK', usageData);
      
      if (usageError) {
        setDiagnosisResult(`Error en tabla inventory_usage: ${usageError.message}`);
        console.error('Error en tabla inventory_usage:', usageError);
        return;
      }
      
      // 3. Verificar tabla inventory_restock
      const { data: restockData, error: restockError } = await supabase
        .from('inventory_restock')
        .select('id, inventory_id')
        .limit(1);
      
      console.log('Tabla inventory_restock:', restockError ? 'ERROR' : 'OK', restockData);
      
      if (restockError) {
        setDiagnosisResult(`Error en tabla inventory_restock: ${restockError.message}`);
        console.error('Error en tabla inventory_restock:', restockError);
        return;
      }
      
      // 4. Intentar insertar y actualizar para probar permisos
      try {
        // Obtener ID de organización del usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autorizado');
        
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (!userData || !userData.organization_id) throw new Error('Sin organización');
        
        // Crear item de prueba
        const testItem = {
          name: `Test Item ${Date.now()}`,
          description: 'Item de diagnóstico - borrar',
          organization_id: userData.organization_id,
          quantity: 100,
          unit: 'unidades',
          min_stock: 10,
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('inventory_items')
          .insert([testItem])
          .select();
        
        if (insertError) {
          setDiagnosisResult(`Error al insertar: ${insertError.message}`);
          console.error('Error al insertar:', insertError);
          return;
        }
        
        if (!insertData || insertData.length === 0) {
          setDiagnosisResult('Inserción exitosa pero no se devolvieron datos');
          return;
        }
        
        const testItemId = insertData[0].id;
        
        // Probar actualización
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ quantity: 110 })
          .eq('id', testItemId);
        
        if (updateError) {
          setDiagnosisResult(`Error al actualizar: ${updateError.message}`);
          console.error('Error al actualizar:', updateError);
          return;
        }
        
        // Probar reposición
        const restockTest = {
          inventory_id: testItemId,
          quantity: 10,
          supplier: 'Test Supplier',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: userData.organization_id
        };
        
        const { error: restockInsertError } = await supabase
          .from('inventory_restock')
          .insert([restockTest]);
        
        if (restockInsertError) {
          setDiagnosisResult(`Error al insertar reposición: ${restockInsertError.message}`);
          console.error('Error al insertar reposición:', restockInsertError);
          return;
        }
        
        // Eliminar item de prueba para limpiar
        await supabase
          .from('inventory_items')
          .delete()
          .eq('id', testItemId);
      } catch (testError: any) {
        setDiagnosisResult(`Error en prueba de escritura: ${testError.message}`);
        console.error('Error en prueba de escritura:', testError);
        return;
      }
      
      setDiagnosisResult('✅ Todas las verificaciones completadas exitosamente. No se detectaron problemas en las tablas.');
    } catch (error: any) {
      setDiagnosisResult(`Error general: ${error.message}`);
      console.error('Error en diagnóstico:', error);
    }
  };

  // Ejecutar diagnóstico al cargar
  useEffect(() => {
    runDiagnosis();
  }, []);

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
      console.log('🔄 INICIO OPERACIÓN:', { itemId, data });
      setDiagnosisResult('Procesando operación...');

      // 1. Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      // 2. Obtener el item directamente de la base de datos
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (itemError || !itemData) {
        const errorMsg = 'No se pudo obtener información del item';
        console.error(errorMsg, itemError);
        setDiagnosisResult(errorMsg);
        throw new Error(errorMsg);
      }
      
      // 3. Determinar operación (reposición o uso)
      const isRestock = data.operation === 'restock';
      console.log(`Tipo de operación: ${isRestock ? 'REPOSICIÓN' : 'USO'}`);
      
      // 4. Procesar cantidad
      const quantity = Number(data.operationQuantity) || 0;
      
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      
      if (!isRestock && quantity > itemData.quantity) {
        throw new Error('La cantidad no puede ser mayor al stock disponible');
      }
      
      // 5. Calcular nueva cantidad
      const currentQuantity = itemData.quantity;
      const newQuantity = isRestock 
        ? currentQuantity + quantity 
        : Math.max(0, currentQuantity - quantity);
        
      console.log(`Actualización de cantidad: ${currentQuantity} ${isRestock ? '+' : '-'} ${quantity} = ${newQuantity}`);
      
      // 6. Preparar datos de actualización de inventario
      const updateData = {
        quantity: newQuantity,
        status: newQuantity === 0 ? 'out_of_stock' : 
               newQuantity <= itemData.min_stock ? 'low' : 'available',
        updated_at: new Date().toISOString()
      };
      
      let restockId = null;
      let usageId = null;
      
      // Generar timestamp consistente para todas las operaciones
      const now = new Date().toISOString();
      const today = now.split('T')[0];
      
      // PROCESO PARA REPOSICIÓN
      if (isRestock) {
        try {
          // PASO 1: Registrar operación en tabla inventory_restock
          // NOTA: La tabla inventory_restock necesita organization_id (not-null constraint)
          const restockData = {
            inventory_id: itemId,
            quantity: quantity,
            supplier: data.userName || user.email || 'Sistema',
            date: data.date || today,
            created_at: now,
            updated_at: now,
            organization_id: itemData.organization_id // Incluir el organization_id del item
          };
          
          console.log('📦 Registrando reposición con datos:', restockData);
          
          // IMPORTANTE: Asegurar que estamos enviando exactamente los campos que existen en la tabla
          const { data: insertResult, error: restockError } = await supabase
            .from('inventory_restock')
            .insert([restockData])
            .select('*');
          
          if (restockError) {
            console.error('Error al registrar reposición:', restockError);
            console.error('Código de error:', restockError.code);
            console.error('Detalles:', restockError.details);
            console.error('Mensaje:', restockError.message);
            setDiagnosisResult(`Error al registrar reposición: ${restockError.message}`);
            throw restockError;
          }
          
          console.log('✅ Reposición registrada exitosamente:', insertResult);
          
          if (insertResult && insertResult.length > 0) {
            restockId = insertResult[0].id;
            console.log('ID de reposición generado:', restockId);
          } else {
            console.warn('No se recibió ID de reposición después de la inserción');
          }

          // PASO 2: Actualizar el inventario después de registrar la reposición
          console.log('Actualizando inventario después de registrar reposición:', updateData);
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update(updateData)
            .eq('id', itemId);
            
          if (updateError) {
            console.error('Error al actualizar inventario:', updateError);
            setDiagnosisResult(`Error al actualizar inventario: ${updateError.message}`);
            throw updateError;
          }
          
          // PASO 3: Verificar que la reposición se haya registrado correctamente
          console.log('Verificando registro de reposición recién creado...');
          
          // Si tenemos un ID, buscamos ese registro específico
          if (restockId) {
            const { data: verifyData, error: verifyError } = await supabase
              .from('inventory_restock')
              .select('*')
              .eq('id', restockId)
              .single();
              
            if (verifyError) {
              console.error('Error al verificar reposición específica:', verifyError);
            } else {
              console.log('Registro de reposición verificado por ID:', verifyData);
            }
          }
          
          // Buscamos también por inventory_id para ver todos los registros
          const { data: allRecentData, error: recentError } = await supabase
            .from('inventory_restock')
            .select('*')
            .eq('inventory_id', itemId)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (recentError) {
            console.error('Error al verificar reposiciones recientes:', recentError);
          } else {
            console.log('Últimos 5 registros de reposición para este item:', allRecentData);
          }
          
        } catch (restockError: any) {
          console.error('Error durante el proceso de reposición:', restockError);
          setDiagnosisResult(`Error en reposición: ${restockError.message || 'Error desconocido'}`);
          throw restockError;
        }
      } 
      // PROCESO PARA USO
      else {
        try {
          // PASO 1: Actualizar inventario primero (para uso, reducimos stock)
          console.log('Actualizando inventario para registro de uso:', updateData);
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update(updateData)
            .eq('id', itemId);
            
          if (updateError) {
            console.error('Error al actualizar inventario:', updateError);
            setDiagnosisResult(`Error al actualizar inventario: ${updateError.message}`);
            throw updateError;
          }
          
          // PASO 2: Registrar operación en tabla inventory_usage
          const usageData = {
            inventory_id: itemId,
            quantity: quantity,
            user_id: user.id,
            user_name: data.userName || user.email || 'Usuario',
            date: data.date || today,
            created_at: now,
            updated_at: now
          };
          
          console.log('Registrando uso:', usageData);
          
          const { data: insertResult, error: usageError } = await supabase
            .from('inventory_usage')
            .insert([usageData])
            .select();
            
          console.log('Resultado de inserción de uso:', insertResult);
          
          if (usageError) {
            console.error('Error al registrar uso:', usageError);
            setDiagnosisResult(`Error al registrar uso: ${usageError.message}`);
            throw usageError;
          }
          
          console.log('Uso registrado exitosamente:', insertResult);
          if (insertResult && insertResult.length > 0) {
            usageId = insertResult[0].id;
            console.log('ID de uso generado:', usageId);
          }
        } catch (usageError: any) {
          console.error('Error durante el proceso de uso:', usageError);
          setDiagnosisResult(`Error en uso: ${usageError.message || 'Error desconocido'}`);
          throw usageError;
        }
      }
      
      // 9. Actualizar la interfaz de usuario
      await loadInventoryItems();
      
      // 10. Verificar que el inventario se actualizó correctamente
      const { data: verifyData } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', itemId)
        .single();
        
      console.log('Verificación después de la operación:', verifyData);
      
      // 11. Informar éxito
      const successMsg = isRestock 
        ? `Reposición exitosa: +${quantity} unidades (actual: ${verifyData?.quantity || newQuantity})` 
        : `Uso registrado: -${quantity} unidades (actual: ${verifyData?.quantity || newQuantity})`;
        
      console.log('✅ OPERACIÓN COMPLETA:', successMsg);
      setDiagnosisResult(successMsg);
      toast.success(successMsg);
      
      // Devolver resultado
      return {
        success: true,
        operation: isRestock ? 'restock' : 'use',
        previousQuantity: currentQuantity,
        newQuantity: verifyData?.quantity || newQuantity,
        timestamp: now,
        recordId: isRestock ? restockId : usageId
      };
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al procesar la operación';
      console.error('❌ ERROR EN OPERACIÓN:', errorMsg, error);
      setDiagnosisResult(`Error en operación: ${errorMsg}`);
      toast.error(errorMsg);
      throw error;
    }
  };

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

  const handleModalSubmit = async (formData: any) => {
    try {
      console.log('Modal Submit:', { mode: modalMode, item: selectedItem?.id, formType: typeof formData });
      
      // Determinar la operación basada en el modo del modal
      if (modalMode === 'use' || modalMode === 'restock') {
        if (!selectedItem) {
          console.error('No hay item seleccionado para la operación');
          toast.error('Error: No se encontró el item');
          return;
        }
        
        console.log(`Iniciando operación de ${modalMode === 'restock' ? 'reposición' : 'uso'} para item:`, selectedItem.name);
        
        try {
          // Procesar la operación directamente
          await registerItemUsage(selectedItem.id, formData);
          
          // La actualización de UI se maneja en registerItemUsage
          // En caso de reposición, el cierre del modal se maneja en el componente InventoryModal
          return {
            success: true,
            itemId: selectedItem.id
          };
        } catch (error) {
          console.error(`Error en operación de ${modalMode}:`, error);
          throw error;
        }
      } else if (modalMode === 'edit' && selectedItem) {
        console.log('Actualizando item existente:', selectedItem.name);
        await updateInventoryItem({
          ...selectedItem,
          ...formData
        });
        
        // Cerrar modal y mostrar mensaje
        setIsModalOpen(false);
        toast.success('Item actualizado correctamente');
      } else if (modalMode === 'create') {
        console.log('Creando nuevo item');
        await createInventoryItem(formData);
        
        // Cerrar modal y mostrar mensaje
        setIsModalOpen(false);
        toast.success('Item creado correctamente');
      }
      
      // Recargar datos para actualizar la interfaz
      await loadInventoryItems();
      
    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      toast.error('Error al procesar la operación');
    }
  }

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
                setSelectedItem(undefined)
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

        {/* Sección de diagnóstico */}
        {diagnosisResult && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Diagnóstico del Sistema</h3>
                    <p className="text-sm text-gray-500 mt-1">{diagnosisResult}</p>
                  </div>
                </div>
                <button
                  onClick={() => runDiagnosis()}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  title="Ejecutar diagnóstico otra vez"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="border-t border-blue-100 bg-blue-50 px-6 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Prueba manual de reposición:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      if (items.length === 0) {
                        toast.error('No hay items para probar');
                        return;
                      }

                      // Probar con el primer item
                      const testItem = items[0];
                      setDiagnosisResult(`Probando reposición con item: ${testItem.name}`);
                      
                      try {
                        // Usar registerItemUsage directamente para la prueba
                        const result = await registerItemUsage(testItem.id, {
                          operationQuantity: 1,
                          date: new Date().toISOString().split('T')[0],
                          userName: 'Test User',
                          operation: 'restock'
                        });
                        
                        setDiagnosisResult(`Reposición exitosa: ${JSON.stringify(result)}`);
                        await loadInventoryItems(); // Refrescar datos
                      } catch (error: any) {
                        setDiagnosisResult(`Error en reposición: ${error.message}`);
                      }
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-blue-700 
                             bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test Reposición
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (items.length === 0) {
                        toast.error('No hay items para probar');
                        return;
                      }

                      const testItem = items[0];
                      setDiagnosisResult(`Probando registro directo en inventory_restock para: ${testItem.name}`);
                      
                      try {
                        // Insertando directamente en la tabla inventory_restock
                        const now = new Date().toISOString();
                        const restockData = {
                          inventory_id: testItem.id,
                          quantity: 1,
                          supplier: 'Test Direct',
                          date: now.split('T')[0],
                          organization_id: testItem.organization_id,
                          created_at: now,
                          updated_at: now
                        };
                        
                        const { data, error } = await supabase
                          .from('inventory_restock')
                          .insert([restockData]);
                          
                        if (error) {
                          console.error('Error en inserción directa:', error);
                          setDiagnosisResult(`Error en inserción directa: ${error.message}`);
                        } else {
                          setDiagnosisResult(`Registro directo exitoso en inventory_restock`);
                          console.log('Registro directo completado');
                          
                          // Verificar que se insertó
                          const { data: checkData } = await supabase
                            .from('inventory_restock')
                            .select('*')
                            .eq('inventory_id', testItem.id)
                            .order('created_at', { ascending: false })
                            .limit(5);
                            
                          console.log('Últimos registros de reposición:', checkData);
                        }
                      } catch (error: any) {
                        setDiagnosisResult(`Error en inserción directa: ${error.message}`);
                      }
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-green-700 
                             bg-green-100 hover:bg-green-200 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Test Directo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      onClick={async () => {
                        setSelectedItem(item);
                        setModalMode('restock');
                        console.log('Abriendo modal de reposición para item:', item.name, item.id);
                        
                        // Dar tiempo para que se actualice el estado
                        setTimeout(() => {
                          setIsModalOpen(true);
                          
                          // Mostrar mensaje de confirmación
                          toast.success(`Modal abierto para reponer ${item.name}`);
                          
                          // Registrar la acción para el diagnóstico
                          setDiagnosisResult(`Abriendo modal para reponer ${item.name}. ID: ${item.id}`);
                        }, 100);
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
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
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-gray-600 hover:text-blue-600"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleItemClick(item)}
                            className="text-gray-600 hover:text-green-600"
                            title="Registrar uso"
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
                            className="text-gray-600 hover:text-red-600"
                            title="Eliminar"
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
      </div>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Cerrando modal...');
          setIsModalOpen(false);
          setModalMode('edit');
          // Recargar datos al cerrar el modal para asegurar que la UI esté actualizada
          console.log('Recargando datos del inventario después de cerrar el modal...');
          setTimeout(() => {
            loadInventoryItems().then(() => {
              console.log('Datos recargados exitosamente');
            }).catch(err => {
              console.error('Error al recargar datos:', err);
            });
          }, 500); // Pequeño retraso para asegurar que todas las operaciones anteriores hayan terminado
        }}
        onSubmit={handleModalSubmit}
        item={selectedItem}
        mode={modalMode}
      />
    </div>
  )
}