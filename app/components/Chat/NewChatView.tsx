'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      if (!user?.id) {
        console.error('No user ID');
        return;
      }

      setLoading(true);
      console.log('Starting chat creation with admin:', adminId);

      // Crear o obtener la sala de chat usando la función RPC
      const { data: roomId, error: roomError } = await supabase
        .rpc('get_or_create_direct_chat', {
          target_user_id: adminId
        });

      console.log('get_or_create_direct_chat result:', { roomId, error: roomError });

      if (roomError) {
        console.error('Error creating chat:', roomError);
        throw roomError;
      }
      
      if (!roomId) {
        console.error('No room ID returned');
        throw new Error('No se pudo crear la sala de chat');
      }

      // Esperar un momento para que se procesen los cambios
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Chat creation completed successfully');
      onChatCreated(roomId);
    } catch (error) {
      console.error('Error in handleSelectAdmin:', error);
      toast.error('Error al crear el chat');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar administrador..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => (
            <button
              key={admin.id}
              onClick={() => handleSelectAdmin(admin.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex-1">
                <h3 className="font-medium">
                  {admin.first_name} {admin.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{admin.email}</p>
              </div>
            </button>
          ))
        ) : (
          <p className="text-center text-muted-foreground">
            No se encontraron administradores
          </p>
        )}
      </div>
    </div>
  );
} 