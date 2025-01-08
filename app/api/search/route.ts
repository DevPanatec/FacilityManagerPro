import { createRouteHandlerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Definimos las interfaces
interface SearchHit {
  _index: string;
  _id: string;
  _score: number;
  _source: {
    title?: string;
    first_name?: string;
    last_name?: string;
    description?: string;
    content?: string;
    [key: string]: any;
  };
}

interface SearchResponse {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: SearchHit[];
  };
}

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    // Construir consulta de Elasticsearch
    const searchBody = {
      query: {
        multi_match: {
          query,
          fields: [
            'title^2',
            'first_name^2',
            'last_name^2',
            'description',
            'content'
          ],
          fuzziness: 'AUTO'
        }
      }
    }

    // Realizar búsqueda usando fetch directamente
    const elasticResponse = await fetch(`${process.env.ELASTICSEARCH_URL}/${type || '_all'}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ELASTICSEARCH_API_KEY ? {
          'Authorization': `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`
        } : {})
      },
      body: JSON.stringify(searchBody)
    })

    if (!elasticResponse.ok) {
      throw new Error(`Elasticsearch error: ${elasticResponse.statusText}`)
    }

    const elasticResults = await elasticResponse.json() as SearchResponse

    if (!elasticResults.hits) {
      return NextResponse.json({ results: [] })
    }

    // Transformar resultados
    const results = elasticResults.hits.hits.map(hit => ({
      type: hit._index,
      id: hit._id,
      title: hit._source.title || `${hit._source.first_name} ${hit._source.last_name}`,
      description: hit._source.description || hit._source.content,
      score: hit._score,
      data: hit._source
    }))

    return NextResponse.json({ results })
  } catch (error: unknown) {
    console.error('Error en búsqueda:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al realizar la búsqueda';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
