interface HistoryRecord {
  type: 'usage' | 'restock';
  quantity: number;
  user_name?: string;
  supplier?: string;
  date: string;
}

interface InventoryHistoryProps {
  history: HistoryRecord[];
}

export default function InventoryHistory({ history }: InventoryHistoryProps) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Movimientos</h3>
      <div className="space-y-4">
        {history.map((record, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div className="text-sm text-gray-500">
                {record.type === 'usage' ? (
                  <>
                    <span className="font-medium text-red-600">Uso:</span> {record.quantity} unidades
                    <br />
                    <span className="font-medium">Usuario:</span> {record.user_name || 'Usuario no especificado'}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-green-600">Reposición:</span> {record.quantity} unidades
                    <br />
                    <span className="font-medium">Proveedor:</span> {record.supplier || 'No especificado'}
                  </>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(record.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 