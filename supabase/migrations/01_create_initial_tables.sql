-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de organizaciones
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  logo_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de personal
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  total_empleados INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de áreas
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  total_areas INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de actividades
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  total_actividades INTEGER NOT NULL DEFAULT 0,
  tipo_actividad VARCHAR(50) NOT NULL DEFAULT 'servicios',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de ingresos
CREATE TABLE IF NOT EXISTS revenue (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  monto DECIMAL(15,2) NOT NULL DEFAULT 0,
  periodo DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
); 