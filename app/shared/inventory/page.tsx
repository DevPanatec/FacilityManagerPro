'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
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

// Variantes de animación
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Inventario
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Gestiona y monitorea tu inventario en tiempo real
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setModalMode('create')
              setIsModalOpen(true)
            }}
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Item
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transform transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-4 bg-blue-50 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-medium text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transform transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-4 bg-yellow-50 rounded-xl">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-medium text-gray-600">Stock Crítico</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lowStock}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transform transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-4 bg-green-50 rounded-xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-medium text-gray-600">Disponibles</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {items.filter(item => item.status === 'available').length}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar en inventario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50
                           text-base placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         bg-gray-50 text-base text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent transition-all duration-200"
              >
                <option value="all">Todos los estados</option>
                <option value="available">Disponible</option>
                <option value="low">Stock bajo</option>
                <option value="out_of_stock">Sin stock</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
                      className={`px-6 py-4 text-left text-sm font-semibold text-gray-900
                                ${key !== 'actions' ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-150' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        {key !== 'actions' && sortConfig.key === key && (
                          <span className="text-blue-600">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <motion.span 
                            className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mr-2 ${
                              item.quantity > item.min_stock ? 'bg-green-400' :
                              item.quantity === 0 ? 'bg-red-400' : 'bg-yellow-400'
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          />
                          <span className="text-sm text-gray-900 font-medium">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.min_stock} {item.unit}
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                            ${calculateItemStatus(item) === 'available'
                              ? 'bg-green-100 text-green-800'
                              : calculateItemStatus(item) === 'out_of_stock'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {calculateItemStatus(item) === 'available' ? 'Disponible' :
                           calculateItemStatus(item) === 'out_of_stock' ? 'Sin Stock' : 'Stock Bajo'}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.organization?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditClick(item)}
                            className="text-gray-600 hover:text-blue-600 transition-colors duration-150"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleItemClick(item)}
                            className="text-gray-600 hover:text-green-600 transition-colors duration-150"
                            title="Registrar uso"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        item={selectedItem}
        mode={modalMode}
      />
    </motion.div>
  )
}