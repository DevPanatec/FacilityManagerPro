'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { InventoryItem } from '../types' // Necesitarás crear este archivo de tipos

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  item?: InventoryItem
  mode: 'edit' | 'use' | 'restock' | 'create'
}

export default function InventoryModal({ isOpen, onClose, onSubmit, item, mode }: InventoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    minimum_quantity: 0,
    unit_of_measure: 'unidades'
  })

  useEffect(() => {
    if (isOpen) {
      if (item && (mode === 'edit' || mode === 'use' || mode === 'restock')) {
        setFormData({
          name: item.name || '',
          description: item.description || '',
          quantity: mode === 'edit' ? item.quantity : 0,
          minimum_quantity: item.minimum_quantity || 0,
          unit_of_measure: item.unit_of_measure || 'unidades'
        })
      } else {
        setFormData({
          name: '',
          description: '',
          quantity: 0,
          minimum_quantity: 0,
          unit_of_measure: 'unidades'
        })
      }
    }
  }, [isOpen, item, mode])

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {mode === 'create' ? 'Nuevo Item' : 
                     mode === 'edit' ? 'Editar Item' :
                     mode === 'use' ? 'Registrar Uso' : 'Registrar Reposición'}
                  </h3>

                  <div className="space-y-4">
                    {(mode === 'create' || mode === 'edit') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nombre</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                     focus:ring-blue-500 sm:text-sm"
                            placeholder="Nombre del item"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Descripción</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                     focus:ring-blue-500 sm:text-sm"
                            placeholder="Descripción del item"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                              type="number"
                              value={formData.minimum_quantity}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                minimum_quantity: Number(e.target.value) || 0
                              }))}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                       focus:ring-blue-500 sm:text-sm"
                              min="0"
                              required
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 
                                           border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                              {formData.unit_of_measure}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                          <input
                            type="text"
                            value={formData.unit_of_measure}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit_of_measure: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                     focus:ring-blue-500 sm:text-sm"
                            placeholder="Ej: unidades, kg, litros"
                            required
                          />
                        </div>
                      </>
                    )}

                    {mode === 'restock' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad a Reponer
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={formData.quantity || 0}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                            min="1"
                            required
                          />
                          <div className="text-sm text-gray-500 flex items-center">
                            {formData.unit_of_measure}
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
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              quantity: Number(e.target.value) || 0
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4263eb]"
                            min="1"
                            max={item?.quantity || 0}
                            required
                          />
                          <div className="text-sm text-gray-500 flex items-center">
                            {formData.unit_of_measure}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => onSubmit(formData)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 
                             py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none 
                             focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {mode === 'create' ? 'Crear' : 
                     mode === 'edit' ? 'Guardar' :
                     mode === 'use' ? 'Registrar Uso' : 'Registrar Reposición'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm 
                             px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                             sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 