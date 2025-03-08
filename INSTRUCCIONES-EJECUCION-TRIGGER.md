# Instrucciones para Ejecutar el Trigger en Supabase

## Resumen

Este documento explica cómo ejecutar el trigger SQL para sincronizar automáticamente los usuarios entre `auth.users` y `public.users`, solucionando el problema de acceso a los schemas en Supabase.

## Requisitos Previos

1. Acceso administrativo a tu proyecto Supabase
2. Asegúrate de tener la tabla `public.users` creada con al menos estas columnas:
   - `id` (UUID, clave primaria)
   - `email` (texto)

## Pasos para Ejecutar el Trigger

### 1. Accede al Panel de Control de Supabase

1. Ve a [app.supabase.com](https://app.supabase.com) e inicia sesión
2. Selecciona tu proyecto

### 2. Abre el SQL Editor

1. En el menú lateral, haz clic en "SQL Editor"
2. Haz clic en "New Query" para crear una nueva consulta

### 3. Copia y Pega el Siguiente Código SQL

```sql
-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insertar el nuevo usuario en public.users
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger para ejecutarse cuando se crea un usuario en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para manejar actualizaciones de usuarios
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Actualizar el registro correspondiente en public.users
  UPDATE public.users
  SET email = new.email
  WHERE id = new.id;
  RETURN new;
END;
$$;

-- Trigger para ejecutarse cuando se actualiza un usuario en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_user();

-- Opcional: Trigger para eliminar usuario en public.users cuando se elimina en auth.users
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Eliminar el registro correspondiente en public.users
  DELETE FROM public.users
  WHERE id = old.id;
  RETURN old;
END;
$$;

-- Trigger para ejecutarse cuando se elimina un usuario en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();
```

### 4. Ejecuta la Consulta SQL

1. Haz clic en el botón "Run" o presiona Ctrl+Enter (Cmd+Enter en Mac)
2. Verifica que no hay errores en la ejecución

### 5. Verifica que los Triggers se Han Creado Correctamente

1. Navega a "Database" en el menú lateral
2. Ve a la sección "Functions" 
3. Deberías ver las funciones `handle_new_user`, `handle_updated_user`, y `handle_deleted_user`

### 6. Prueba el Trigger

1. Navega a "Authentication" > "Users"
2. Crea un nuevo usuario haciendo clic en "Invite"
3. Completa los detalles del usuario y haz clic en "Invite"
4. Navega a la tabla `public.users` (en la sección "Table Editor")
5. Verifica que el nuevo usuario se ha agregado automáticamente

## Solución de Problemas

### Si el Trigger No Funciona:

1. **Problema**: La tabla `public.users` no tiene las columnas necesarias
   - **Solución**: Asegúrate de que tu tabla `public.users` tenga al menos las columnas `id` (UUID) y `email`

2. **Problema**: Errores de permisos
   - **Solución**: Asegúrate de estar utilizando una cuenta con permisos de administrador

3. **Problema**: Conflictos con triggers existentes
   - **Solución**: Verifica si ya existen triggers en la tabla `auth.users` y modifica el código según sea necesario

## Nota Importante

Este trigger sincronizará automáticamente los cambios en la tabla `auth.users` con tu tabla `public.users`. Esto te permite:

1. No tener que insertar manualmente registros en ambas tablas
2. Mantener la consistencia entre las tablas de autenticación y tus datos de usuario
3. Seguir las mejores prácticas de Supabase sin intentar acceder directamente al schema `auth`

## Siguiente Paso

Después de implementar estos triggers, actualiza tus scripts existentes siguiendo las instrucciones en `SOLUCION-PROBLEMA-SCHEMAS-SUPABASE.md`. 