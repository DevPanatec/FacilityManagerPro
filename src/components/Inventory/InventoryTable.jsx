'use client';
import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiBox } from 'react-icons/fi';

function InventoryTable({ readOnly, showStockLevels, showHistory, showCriticalItems }) {
  const { user } = useAuth();
  const { permissions } = usePermissions(user);
  const canEdit = permissions?.inventory?.edit || false;
  const canUse = permissions?.inventory?.use || false;
  const canDelete = permissions?.inventory?.delete || false;

  useEffect(() => {
    console.log('InventoryTable montado');
    console.log('readOnly:', readOnly);
    console.log('Usuario:', user);
    console.log('Permisos:', permissions);
  }, [readOnly, user, permissions]);

  // Mock data para pruebas
  const items = [
    { id: 1, name: 'Item 1', stock: 10, status: 'Disponible' },
    { id: 2, name: 'Item 2', stock: 5, status: 'Bajo' },
  ];

  const handleUseItem = (item) => {
    if (!canUse) {
      toast.error('No tienes permisos para usar items del inventario');
      return;
    }
    // Lógica de uso...
  };

  const handleEditItem = (item) => {
    if (!canEdit) {
      toast.error('No tienes permisos para editar el inventario');
      return;
    }
    // Lógica de edición...
  };

  const handleDeleteItem = (item) => {
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar items del inventario');
      return;
    }
    // Lógica de eliminación...
  };

  return (
    <div className="overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b">
        <img 
          src="/images/marpes.jpeg" 
          alt="Logo Marpes" 
          className="h-12 w-auto"
        />
        <div className="flex gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Items:</span> {items.length}
          </div>
          {showStockLevels && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Stock Crítico:</span> {items.filter(i => i.status === 'Bajo').length}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.status === 'Disponible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {canUse && (
                    <button 
                      onClick={() => handleUseItem(item)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors">
                      <FiBox className="w-4 h-4" />
                    </button>
                  )}
                  {canEdit && (
                    <button 
                      onClick={() => handleEditItem(item)}
                      className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button 
                      onClick={() => handleDeleteItem(item)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryTable; 