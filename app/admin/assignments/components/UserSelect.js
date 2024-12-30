export const UserSelect = ({ value, onChange, users }) => (
  <div>
    <label className="block text-sm font-medium text-blue-600 mb-1 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      Usuario
    </label>
    <div className="relative">
      <select
        name="user"
        value={value}
        onChange={onChange}
        className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
      >
        <option value="">Seleccionar Usuario</option>
        {users
          .filter(empleado => empleado.estado === 'Activo')
          .map(empleado => (
            <option key={empleado.id} value={empleado.nombre}>
              {empleado.nombre}
            </option>
          ))}
      </select>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <div className="h-5 w-5 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
); 