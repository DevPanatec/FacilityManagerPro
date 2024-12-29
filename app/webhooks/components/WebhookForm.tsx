'use client';

import { useState } from 'react';

export default function WebhookForm({ webhook, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    event_type: webhook?.event_type || '',
    endpoint_url: webhook?.endpoint_url || '',
    is_active: webhook?.is_active ?? true,
    secret_key: webhook?.secret_key || '',
    retry_count: webhook?.retry_count || 3
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Evento
        </label>
        <input
          type="text"
          value={formData.event_type}
          onChange={e => setFormData({ ...formData, event_type: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          URL del Endpoint
        </label>
        <input
          type="url"
          value={formData.endpoint_url}
          onChange={e => setFormData({ ...formData, endpoint_url: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="ml-2">Activo</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
} 