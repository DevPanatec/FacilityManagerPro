import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    openapi: '3.0.0',
    info: {
      title: 'API de Organizaciones',
      version: '1.0.0'
    },
    paths: {
      '/api/organizations': {
        get: {
          summary: 'Listar organizaciones'
        },
        post: {
          summary: 'Crear organización'
        }
      },
      '/api/organizations/{id}': {
        get: {
          summary: 'Obtener organización'
        },
        put: {
          summary: 'Actualizar organización'
        },
        delete: {
          summary: 'Eliminar organización'
        }
      }
    }
  });
} 