import React, { useEffect, useState } from 'react';

interface Room {
  id: string;
  name: string;
}

interface RoomSelectProps {
  organizationId: string | null;
  value: string;
  onChange: (value: string) => void;
}

export default function RoomSelect({ organizationId, value, onChange }: RoomSelectProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRooms() {
      if (!organizationId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/organizations/${organizationId}/rooms`);
        if (!response.ok) throw new Error('Failed to fetch rooms');
        
        const data = await response.json();
        setRooms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rooms');
        setRooms([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, [organizationId]);

  if (loading) {
    return (
      <select 
        disabled 
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option>Loading rooms...</option>
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
          <option>Error loading rooms</option>
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
      <option value="">Select a room</option>
      {rooms.map((room) => (
        <option key={room.id} value={room.id}>
          {room.name}
        </option>
      ))}
    </select>
  );
} 