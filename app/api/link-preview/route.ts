import { NextResponse } from 'next/server'
import { parse } from 'node-html-parser'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Realizar la solicitud al sitio web
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch URL')
    }

    const html = await response.text()
    const root = parse(html)

    // Extraer metadatos
    const getMetaContent = (name: string): string | null => {
      const meta = root.querySelector(`meta[property="${name}"], meta[name="${name}"]`)
      return meta?.getAttribute('content') || null
    }

    // Intentar obtener la imagen de diferentes fuentes
    const image = 
      getMetaContent('og:image') ||
      getMetaContent('twitter:image') ||
      root.querySelector('link[rel="image_src"]')?.getAttribute('href') ||
      null

    // Intentar obtener el título de diferentes fuentes
    const title =
      getMetaContent('og:title') ||
      getMetaContent('twitter:title') ||
      root.querySelector('title')?.text ||
      ''

    // Intentar obtener la descripción de diferentes fuentes
    const description =
      getMetaContent('og:description') ||
      getMetaContent('twitter:description') ||
      getMetaContent('description') ||
      ''

    // Obtener el dominio
    const domain = new URL(url).hostname.replace('www.', '')

    return NextResponse.json({
      url,
      title: title.trim(),
      description: description.trim(),
      image: image ? new URL(image, url).toString() : null,
      domain
    })
  } catch (error) {
    console.error('Error fetching link preview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    )
  }
} 