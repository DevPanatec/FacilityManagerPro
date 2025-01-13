import React from 'react';

interface Task {
  id: number;
  descripcion: string;
  asignado: string;
  prioridad: string;
  estado: string;
  fechaLimite: string;
  startTime: Date | null;
  endTime: Date | null;
}

interface Area {
  id: number;
  nombre: string;
  color: string;
  tareas: Task[];
}

interface AreaSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  areas: Area[];
}

export const AreaSelect: React.FC<AreaSelectProps> = ({ value, onChange, areas }) => {
  return (
    <div>
      <label htmlFor="area" className="block text-sm font-medium text-gray-700">
        Área
      </label>
      <select
        id="area"
        name="area"
        value={value}
        onChange={onChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="">Seleccione un área</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.nombre} ({area.tareas.length} tareas)
          </option>
        ))}
      </select>
    </div>
  );
}; 