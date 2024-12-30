export const AreaSelect = ({ value, onChange, areas }) => (
  <div>
    <label className="block text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      Área
    </label>
    <div className="relative">
      <select
        name="area"
        value={value}
        onChange={onChange}
        className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
      >
        <option value="">Seleccionar Área</option>
        {areas.map(area => (
          <option key={area.id} value={area.nombre}>
            {area.nombre}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <div className="h-5 w-5 text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
    </div>
  </div>
); 