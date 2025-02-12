'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ContingencyType {
  id: string;
  name: string;
  description?: string;
}

interface ContingencyTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ContingencyTypeSelect({ value, onChange, className = '' }: ContingencyTypeSelectProps) {
  const [types, setTypes] = useState<ContingencyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadContingencyTypes() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autorizado');

        const { data: userProfile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!userProfile) throw new Error('Perfil no encontrado');

        console.log('Cargando tipos para organización:', userProfile.organization_id);

        const { data: contingencyTypes, error: typesError } = await supabase
          .from('contingency_types')
          .select('id, name, description')
          .eq('organization_id', userProfile.organization_id)
          .eq('is_active', true)
          .order('name');

        if (typesError) {
          console.error('Error al cargar tipos:', typesError);
          throw typesError;
        }

        console.log('Tipos cargados:', contingencyTypes);
        setTypes(contingencyTypes || []);
      } catch (error) {
        console.error('Error al cargar tipos de contingencia:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar los tipos de contingencia');
      } finally {
        setLoading(false);
      }
    }

    loadContingencyTypes();
  }, [supabase]);

  if (loading) {
    return (
      <select 
        className={`bg-gray-100 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${className}`}
        disabled
      >
        <option>Cargando tipos...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div>
        <select 
          className={`bg-red-50 border border-red-300 text-red-500 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 ${className}`}
          disabled
        >
          <option>Error al cargar tipos</option>
        </select>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${className}`}
      required
    >
      <option value="">Seleccionar tipo</option>
      {types.map((type) => (
        <option key={type.id} value={type.id} title={type.description || type.name}>
          {type.name}
        </option>
      ))}
    </select>
  );
} 