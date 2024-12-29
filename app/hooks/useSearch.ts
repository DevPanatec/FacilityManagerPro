'use client'

import { useState, useEffect } from 'react'
import { SearchFilter } from '@/app/api/search/route'
import { useDebounce } from './useDebounce'

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle: string
  data: any
}

interface GroupedResults {
  [key: string]: SearchResult[]
}

export function useSearch(organizationId: string) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Partial<SearchFilter>>({})
  const [results, setResults] = useState<GroupedResults>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const debouncedQuery = useDebounce(query, 300)

  const search = async () => {
    if (!debouncedQuery) {
      setResults({})
      setTotal(0)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        query: debouncedQuery,
        organization_id: organizationId,
        ...filters
      })

      const response = await fetch(`/api/search?${params}`)
      if (!response.ok) throw new Error('Error en la búsqueda')

      const data = await response.json()
      setResults(data.results)
      setTotal(data.total)
    } catch (err) {
      setError(err.message)
      setResults({})
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar búsqueda cuando cambie la query o los filtros
  useEffect(() => {
    search()
  }, [debouncedQuery, filters])

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading,
    error,
    total
  }
}

// Hook auxiliar para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
} 