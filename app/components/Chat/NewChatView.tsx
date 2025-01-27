'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { Search } from 'lucide-react';

interface Admin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface NewChatViewProps {
  onClose: () => void;
  onChatCreated: (roomId: string) => void;
}

export function NewChatView({ onClose, onChatCreated }: NewChatViewProps) {
  const { user } = useUser();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadAdmins() {
      try {
        if (!user?.organization_id) return;

        const { data, error } = await supabase
          .rpc('get_org_admins', {
            org_id: user.organization_id
          });

        if (error) throw error;
        setAdmins(data || []);
      } catch (error) {
        console.error('Error loading admins:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAdmins();
  }, [user?.organization_id]);

  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.first_name?.toLowerCase().includes(searchLower) ||
      admin.last_name?.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower)
    );
  });

  async function handleSelectAdmin(adminId: string) {
    try {
      if (!user?.organization_id) return;

      const { data, error } = await supabase
        .rpc('get_or_create_direct_chat', {
          p_organization_id: user.organization_id,
          p_user_id_1: user.id,
          p_user_id_2: adminId
        });

      if (error) throw error;
      
      if (data) {
        onChatCreated(data);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar administrador..."
            className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron administradores' : 'No hay administradores disponibles'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredAdmins.map((admin) => (
              <button
                key={admin.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                onClick={() => handleSelectAdmin(admin.id)}
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {admin.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 