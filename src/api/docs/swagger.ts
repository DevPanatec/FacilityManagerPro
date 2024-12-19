import { OpenAPIV3 } from 'openapi-types';

export const swaggerConfig: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'API de Facility Manager',
    version: '1.0.0',
    description: 'API para gestión de organizaciones e inventario'
  },
  paths: {
    '/api/organizations': {
      get: {
        summary: 'Listar organizaciones',
        description: 'Obtiene todas las organizaciones',
        responses: {
          '200': {
            description: 'Lista de organizaciones'
          }
        }
      },
      post: {
        summary: 'Crear organización',
        description: 'Crea una nueva organización',
        responses: {
          '201': {
            description: 'Organización creada'
          }
        }
      }
    }
  }
}; 