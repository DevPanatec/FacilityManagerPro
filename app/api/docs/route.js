import { createSwaggerSpec } from 'next-swagger-doc';
import { NextResponse } from 'next/server';

export async function GET() {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API de Organizaciones',
        version: '1.0.0',
      },
    },
  });
  return NextResponse.json(spec);
} 