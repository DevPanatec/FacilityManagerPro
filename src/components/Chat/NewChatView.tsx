import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
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
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user?.user_metadata?.org_id) return;

        const { data, error } = await supabase
          .rpc('get_org_admins', {
            org_id: userData.user.user_metadata.org_id
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
  }, []);

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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.user_metadata?.org_id) return;

      const { data, error } = await supabase
        .rpc('get_or_create_direct_chat', {
          p_organization_id: userData.user.user_metadata.org_id,
          p_user_id_1: user?.id,
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar administrador..."
            className="w-full pl-9 pr-4 py-2 rounded-md border bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron administradores' : 'No hay administradores disponibles'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredAdmins.map((admin) => (
              <button
                key={admin.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={() => handleSelectAdmin(admin.id)}
              >
                <div>
                  <h3 className="font-medium">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
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