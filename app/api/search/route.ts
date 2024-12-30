import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Client } from '@elastic/elasticsearch'

// Tipos mejorados
export type SearchFilter = {
  dateFrom?: string
  dateTo?: string
  department?: string
  area?: string
  type?: string
  status?: string
  organization_id: string
  searchType?: 'basic' | 'advanced' // Para alternar entre búsqueda básica y Elasticsearch
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  page?: number
}

// Cliente Elasticsearch (opcional)
const elasticClient = process.env.ELASTICSEARCH_URL 
  ? new Client({ node: process.env.ELASTICSEARCH_URL })
  : null

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const organization_id = searchParams.get('organization_id')

    // Filtros mejorados
    const filters: SearchFilter = {
      organization_id,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      department: searchParams.get('department') || undefined,
      area: searchParams.get('area') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      searchType: (searchParams.get('searchType') as 'basic' | 'advanced') || 'basic',
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: Number(searchParams.get('limit')) || 10,
      page: Number(searchParams.get('page')) || 1
    }

    // Usar Elasticsearch si está disponible y se solicita búsqueda avanzada
    if (elasticClient && filters.searchType === 'advanced') {
      const elasticResults = await elasticClient.search({
        index: ['employees', 'documents', 'reports'],
        body: {
          query: {
            bool: {
              must: [
                { multi_match: {
                    query: query,
                    fields: ['title^2', 'content', 'description', 'first_name', 'last_name']
                  }
                },
                { term: { organization_id: filters.organization_id } }
              ],
              filter: [
                ...(filters.dateFrom ? [{ range: { created_at: { gte: filters.dateFrom } } }] : []),
                ...(filters.dateTo ? [{ range: { created_at: { lte: filters.dateTo } } }] : []),
                ...(filters.department ? [{ term: { department_id: filters.department } }] : []),
                ...(filters.area ? [{ term: { area: filters.area } }] : []),
                ...(filters.status ? [{ term: { status: filters.status } }] : [])
              ]
            }
          },
          sort: filters.sortBy ? [
            { [filters.sortBy]: filters.sortOrder }
          ] : undefined,
          from: (filters.page - 1) * filters.limit,
          size: filters.limit
        }
      })

      // Transformar resultados de Elasticsearch
      const results = elasticResults.hits.hits.map(hit => ({
        type: hit._index,
        id: hit._id,
        title: hit._source.title || `${hit._source.first_name} ${hit._source.last_name}`,
        subtitle: hit._source.description || hit._source.position,
        data: hit._source
      }))

      return NextResponse.json({
        results: groupByType(results),
        total: elasticResults.hits.total.value,
        query
      })
    }

    // Búsqueda básica en Supabase
    let results = []
    
    // Búsqueda en empleados con más filtros
    if (!filters.type || filters.type === 'employees') {
      const query = supabase
        .from('employee_records')
        .select(`
          *,
          position:positions(name),
          department:departments(name),
          area:areas(name)
        `)
        .eq('organization_id', filters.organization_id)
        .or(`
          first_name.ilike.%${query}%,
          last_name.ilike.%${query}%,
          email.ilike.%${query}%
        `)

      // Aplicar filtros adicionales
      if (filters.department) query.eq('department_id', filters.department)
      if (filters.area) query.eq('area_id', filters.area)
      if (filters.dateFrom) query.gte('created_at', filters.dateFrom)
      if (filters.dateTo) query.lte('created_at', filters.dateTo)
      if (filters.status) query.eq('status', filters.status)
      
      const { data: employees } = await query
        .order(filters.sortBy || 'last_name', {
          ascending: filters.sortOrder === 'asc'
        })
        .range(
          (filters.page - 1) * filters.limit,
          filters.page * filters.limit - 1
        )

      if (employees) {
        results.push(...employees.map(emp => ({
          type: 'employee',
          id: emp.id,
          title: `${emp.first_name} ${emp.last_name}`,
          subtitle: `${emp.position?.name} - ${emp.department?.name}`,
          data: emp
        })))
      }
    }

    // Búsquedas similares para documentos y reportes...
    // (código similar al anterior pero adaptado para cada tipo)

    return NextResponse.json({
      results: groupByType(results),
      total: results.length,
      query,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: results.length
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// Función auxiliar para agrupar resultados
function groupByType(results: any[]) {
  return results.reduce((acc, result) => {
    acc[result.type] = acc[result.type] || []
    acc[result.type].push(result)
    return acc
  }, {})
} 