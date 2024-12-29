'use client'

import { useState } from 'react'
import { useSearch } from '@/hooks/useSearch'
import { SearchFilter } from '@/app/api/search/route'

interface SearchBarProps {
  organizationId: string
  onResultClick?: (result: any) => void
}

export function SearchBar({ organizationId, onResultClick }: SearchBarProps) {
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading,
    error,
    total
  } = useSearch(organizationId)

  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: keyof SearchFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  return (
    <div className="relative w-full max-w-2xl">
      {/* Barra de búsqueda */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent" />
            </div>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          Filtros
        </button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-lg border w-full">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha desde
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Departamento
              </label>
              <select
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Todos</option>
                {/* Agregar opciones de departamentos */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Todos</option>
                <option value="employees">Empleados</option>
                <option value="documents">Documentos</option>
                <option value="reports">Reportes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {query && (
        <div className="absolute z-20 mt-2 w-full bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : total === 0 ? (
            <div className="p-4 text-gray-500">No se encontraron resultados</div>
          ) : (
            <div>
              {Object.entries(results).map(([type, items]) => (
                <div key={type} className="p-2">
                  <h3 className="text-sm font-semibold text-gray-700 px-2">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </h3>
                  {items.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => onResultClick?.(result)}
                      className="w-full text-left p-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm text-gray-500">
                        {result.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 