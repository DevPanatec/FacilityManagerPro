'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWebhooks(data);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Webhooks</h2>
      
      {/* Lista de webhooks */}
      <div className="grid gap-4">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="border p-4 rounded">
            <h3 className="font-bold">{webhook.name}</h3>
            <p className="text-sm text-gray-600">{webhook.url}</p>
            <div className="mt-2">
              <span className={`px-2 py-1 rounded text-sm ${
                webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {webhook.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 