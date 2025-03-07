# Gestión de Usuarios en Supabase

## Problema identificado

Durante el desarrollo se ha detectado un problema con la creación y gestión de usuarios a través de la interfaz de Supabase. Los síntomas incluyen:

1. El error "Failed to create user: Database error creating new user" al intentar crear usuarios desde la interfaz
2. Los usuarios creados no muestran el proveedor "Email" en la columna Providers
3. No es posible iniciar sesión con los usuarios creados

Este problema se debe a conflictos entre la estructura de la base de datos y el sistema de autenticación de Supabase, posiblemente relacionados con los triggers y restricciones implementados.

## Solución: Gestión manual de usuarios

Para solucionar este problema, se ha creado un conjunto de funciones SQL en el archivo `user-management.sql` que permiten:

1. Crear usuarios correctamente configurados
2. Reparar usuarios existentes
3. Verificar el estado de los usuarios

### Cómo crear un nuevo usuario

```sql
-- Ejecutar en el Editor SQL de Supabase
SELECT public.create_full_user(
    'nuevo.usuario@example.com',  -- email
    'Password123!',               -- contraseña
    'Nombre',                     -- nombre
    'Apellido',                   -- apellido
    'admin',                      -- rol (debe ser 'admin' u otro valor permitido)
    '0d7f71d0-1b5f-473f-a3d5-68c3abf99584' -- ID de la organización (HospitalesGlobales)
);
```

### Cómo reparar un usuario existente

Si un usuario existe pero no puede iniciar sesión o no muestra el proveedor "Email":

```sql
-- Ejecutar en el Editor SQL de Supabase
SELECT public.fix_user_auth('usuario.existente@example.com');
```

### Cómo verificar el estado de un usuario

Para comprobar si un usuario está correctamente configurado:

```sql
-- Ejecutar en el Editor SQL de Supabase
SELECT * FROM public.check_user_status('usuario@example.com');
```

## IDs de organizaciones disponibles

Para referencia, aquí están los IDs de las organizaciones:

- HospitalesGlobales: `0d7f71d0-1b5f-473f-a3d5-68c3abf99584`
- (Añadir otras organizaciones según sea necesario)

## Solución a largo plazo

A largo plazo, se recomienda:

1. Revisar la estructura de triggers y restricciones implementadas
2. Considerar una simplificación del esquema de base de datos
3. Asegurar la compatibilidad con el sistema de autenticación de Supabase

Mientras tanto, utiliza las funciones proporcionadas para gestionar usuarios de forma segura y efectiva. 