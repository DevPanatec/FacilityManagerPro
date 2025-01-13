import React from 'react';

interface Empleado {
  id: number;
  nombre: string;
  area: string;
  estado: string;
  rol: string;
  turno?: string;
}

interface UserSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  users: Empleado[];
}

export const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, users }) => {
  return (
    <div>
      <label htmlFor="user" className="block text-sm font-medium text-gray-700">
        Usuario
      </label>
      <select
        id="user"
        name="user"
        value={value}
        onChange={onChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="">Seleccione un usuario</option>
        {users
          .filter(user => user.estado === 'Activo')
          .map((user) => (
            <option key={user.id} value={user.nombre}>
              {user.nombre} ({user.rol})
            </option>
          ))}
      </select>
    </div>
  );
}; 