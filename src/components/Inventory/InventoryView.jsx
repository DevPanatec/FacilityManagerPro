'use client';
import React from 'react';
import InventoryTable from './InventoryTable';
import Button from '../Button';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { COMPANY_LOGO } from '../../config/brandConfig';

function InventoryView({ userProfile }) {
  const { user } = useAuth();
  const { permissions } = usePermissions(user);
  const isEnterprise = userProfile === 'enterprise';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <div className="flex gap-3">
          <Button 
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
            Exportar Reporte
          </Button>
          
          {!isEnterprise && (
            <>
              <Button 
                onClick={handleEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors">
                Editar
              </Button>
              <Button 
                onClick={handleAdd}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors">
                Agregar Item
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <InventoryTable 
          readOnly={isEnterprise}
          showStockLevels={true}
          showHistory={true}
          showCriticalItems={true}
        />
      </div>
    </div>
  );
}

export default InventoryView; 