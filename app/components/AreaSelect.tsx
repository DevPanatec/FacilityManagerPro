import React, { useEffect, useState } from 'react';

interface Area {
  id: string;
  name: string;
}

interface AreaSelectProps {
  organizationId: string | null;
  value: string;
  onChange: (value: string) => void;
}

export default function AreaSelect({ organizationId, value, onChange }: AreaSelectProps) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAreas() {
      if (!organizationId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/organizations/${organizationId}/areas`);
        if (!response.ok) throw new Error('Failed to fetch areas');
        
        const data = await response.json();
        setAreas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load areas');
        setAreas([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAreas();
  }, [organizationId]);

  if (loading) {
    return (
      <select 
        disabled 
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option>Loading areas...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="mt-1">
        <select 
          disabled 
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option>Error loading areas</option>
        </select>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      required
    >
      <option value="">Select an area</option>
      {areas.map((area) => (
        <option key={area.id} value={area.id}>
          {area.name}
        </option>
      ))}
    </select>
  );
} 