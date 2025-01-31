'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { Search, Clock, Package, Calendar, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Admin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ChatSuggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface NewChatViewProps {
  onClose: () => void;
  onChatCreated: (roomId: string) => void;
}

const chatSuggestions: ChatSuggestion[] = [
  {
    id: 'turnos',
    title: 'Consultas sobre Turnos',
    description: 'Horarios, cambios, disponibilidad',
    icon: <Clock className="w-6 h-6 text-primary" />
  },
  {
    id: 'inventario',
    title: 'Gestión de Inventario',
    description: 'Stock, productos, movimientos',
    icon: <Package className="w-6 h-6 text-primary" />
  },
  {
    id: 'tareas',
    title: 'Tareas y Actividades',
    description: 'Asignaciones, seguimiento, deadlines',
    icon: <Calendar className="w-6 h-6 text-primary" />
  },
  {
    id: 'reportes',
    title: 'Reportes y Estadísticas',
    description: 'Informes, métricas, análisis',
    icon: <FileText className="w-6 h-6 text-primary" />
  }
];

export function NewChatView({ onClose, onChatCreated }: NewChatViewProps) {
  const { user } = useUser();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAdmins = useCallback(async () => {
    if (!user?.organization_id) {
      toast.error('No se pudo cargar los administradores');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_org_admins', {
          org_id: user.organization_id
        });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('No hay administradores disponibles');
        return;
      }

      setAdmins(data);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast.error('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  }, [user?.organization_id]);

  const handleSelectAdmin = async (adminId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      setLoading(true);
      const { data: roomId, error: roomError } = await supabase
        .rpc('get_or_create_direct_chat', {
          target_user_id: adminId
        });

      if (roomError) throw roomError;
      
      if (!roomId) {
        throw new Error('No se pudo crear la sala de chat');
      }

      // Esperar a que se procese la creación del chat
      await new Promise(resolve => setTimeout(resolve, 500));
      onChatCreated(roomId);
    } catch (error) {
      console.error('Error in handleSelectAdmin:', error);
      toast.error('Error al crear el chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestionId: string) => {
    setSelectedSuggestion(suggestionId);
    await loadAdmins();
  };

  const handleBackClick = () => {
    setSelectedSuggestion(null);
    setSearchTerm('');
    setAdmins([]);
  };

  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.first_name?.toLowerCase().includes(searchLower) ||
      admin.last_name?.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-500">
            {selectedSuggestion ? 'Cargando administradores...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedSuggestion) {
    return (
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">
          ¿Sobre qué quieres consultar?
        </h3>
        <div className="grid gap-4">
          {chatSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion.id)}
              className="flex items-center gap-4 p-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-100 transition-all duration-200 hover:shadow-md group"
            >
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                {suggestion.icon}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                <p className="text-sm text-gray-500">{suggestion.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentSuggestion = chatSuggestions.find(s => s.id === selectedSuggestion);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBackClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {currentSuggestion?.title}
          </h3>
          <p className="text-sm text-gray-500">
            Selecciona un administrador para consultar
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar administrador..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="space-y-2">
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => (
            <button
              key={admin.id}
              onClick={() => handleSelectAdmin(admin.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {admin.first_name[0]}
                </span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                  {admin.first_name} {admin.last_name}
                </h4>
                <p className="text-sm text-gray-500">{admin.email}</p>
              </div>
            </button>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">
            No se encontraron administradores
          </p>
        )}
      </div>
    </div>
  );
} 