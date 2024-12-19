export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'API de Facility Manager',
    version: '1.0.0',
    description: 'API para gestión de organizaciones e inventario'
  },
  paths: {
    '/api/organizations': {
      get: {
        summary: 'Obtener todas las organizaciones',
        responses: {
          '200': {
            description: 'Lista de organizaciones'
          }
        }
      },
      post: {
        summary: 'Crear una organización',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': {
            description: 'Organización creada'
          }
        }
      }
    }
    // ... más endpoints
  }
}; 