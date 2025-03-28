'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@headlessui/react'

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

// Variantes de animación
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.5,
      bounce: 0.3
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.3
    }
  }
};

const inputVariants = {
  focus: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 300
    }
  }
};

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
            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad a Usar
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.operationQuantity}
                onChange={e => setFormData(prev => ({ ...prev, operationQuantity: Number(e.target.value) }))}
                min="1"
                max={item?.quantity || 0}
                required
              />
            </motion.div>
            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuario
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.user}
                onChange={e => setFormData(prev => ({ ...prev, user: e.target.value }))}
                required
              />
            </motion.div>
            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </motion.div>
          </>
        )
      
      case 'restock':
        return (
          <>
            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad a Reponer
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.operationQuantity}
                onChange={e => setFormData(prev => ({ ...prev, operationQuantity: Number(e.target.value) }))}
                min="1"
                required
              />
            </motion.div>
            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proveedor
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.supplier}
                onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                required
              />
            </motion.div>
            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </motion.div>
          </>
        )
      
      default:
        return (
          <>
            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="form-control"
                whileTap="focus"
                variants={inputVariants}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
              </label>
              <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="cleaning">Limpieza</option>
                <option value="tools">Herramientas</option>
                <option value="chemicals">Químicos</option>
                <option value="safety">Seguridad</option>
              </select>
              </motion.div>

              <motion.div
                className="form-control"
                whileTap="focus"
                variants={inputVariants}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  min="0"
                  required
                />
              </motion.div>
              </div>

            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unidad
                </label>
                <input
                  type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  value={formData.unit}
                  onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  required
                />
            </motion.div>

            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Mínimo
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.minStock}
                onChange={e => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                min="0"
                required
              />
            </motion.div>

            <motion.div
              className="form-control"
              whileTap="focus"
              variants={inputVariants}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </motion.div>
          </>
        )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as={motion.div}
          static
          className="fixed inset-0 z-50 overflow-y-auto"
          open={isOpen}
          onClose={onClose}
        >
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
            />

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <motion.div
              className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Dialog.Title
                as="h3"
                className="text-2xl font-bold leading-6 text-gray-900 dark:text-white mb-6"
              >
          {getTitle()}
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'usage' || mode === 'restock' ? (
                  <>
                    <motion.div
                      className="form-control"
                      whileTap="focus"
                      variants={inputVariants}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {mode === 'usage' ? 'Cantidad a Usar' : 'Cantidad a Reponer'}
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        value={formData.operationQuantity}
                        onChange={e => setFormData(prev => ({ ...prev, operationQuantity: Number(e.target.value) }))}
                        min="1"
                        max={mode === 'usage' ? item?.quantity : undefined}
                        required
                      />
                    </motion.div>

                    <motion.div
                      className="form-control"
                      whileTap="focus"
                      variants={inputVariants}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {mode === 'usage' ? 'Usuario' : 'Proveedor'}
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        value={mode === 'usage' ? formData.user : formData.supplier}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          [mode === 'usage' ? 'user' : 'supplier']: e.target.value
                        }))}
                        placeholder={mode === 'usage' ? 'Ej: Juan Pérez' : 'Ej: Proveedor ABC'}
                        required
                      />
                    </motion.div>

                    <motion.div
                      className="form-control"
                      whileTap="focus"
                      variants={inputVariants}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        value={formData.date}
                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="form-control"
                      whileTap="focus"
                      variants={inputVariants}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Item
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        className="form-control"
                        whileTap="focus"
                        variants={inputVariants}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                          value={formData.quantity}
                          onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          min="0"
                          required
                        />
                      </motion.div>

                      <motion.div
                        className="form-control"
                        whileTap="focus"
                        variants={inputVariants}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Unidad
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                          value={formData.unit}
                          onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                          required
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      className="form-control"
                      whileTap="focus"
                      variants={inputVariants}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stock Mínimo
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        value={formData.minStock}
                        onChange={e => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                        min="0"
                        required
                      />
                    </motion.div>

                    <motion.div
                      className="form-control"
                      whileTap="focus"
                      variants={inputVariants}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ubicación
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        value={formData.location}
                        onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        required
                      />
                    </motion.div>
                  </>
                )}

                <div className="mt-8 flex justify-end space-x-3">
                  <motion.button
              type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
            >
              Cancelar
                  </motion.button>
                  <motion.button
              type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
            >
              {mode === 'usage' ? 'Registrar Uso' : 
               mode === 'restock' ? 'Registrar Reposición' : 
               item ? 'Actualizar' : 'Crear'}
                  </motion.button>
          </div>
        </form>
            </motion.div>
      </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
} 