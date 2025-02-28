# Solución para Creación de Usuarios Administradores en FacilityManagerPro

## Problema

La aplicación FacilityManagerPro requiere crear usuarios administradores asociados a organizaciones específicas, pero se han encontrado varios obstáculos:

1. **Restricciones de clave foránea**: La tabla `public.users` tiene una restricción de clave foránea con `auth.users`, lo que impide la creación directa de usuarios en la tabla pública.
2. **Falta de sincronización**: Los usuarios deben existir tanto en `auth.users` (sistema de autenticación de Supabase) como en `public.users` (tabla de la aplicación).
3. **Permisos limitados**: No se pueden ejecutar operaciones privilegiadas en `auth.users` desde la API pública.

## Soluciones implementadas

### 1. Script SQL para crear una función RPC

Se ha creado un script SQL (`crear-funcion-rpc.sql`) que implementa:

- Una función `create_user_rpc` con seguridad elevada (SECURITY DEFINER) que puede:
  - Verificar si la organización existe
  - Crear el usuario en `auth.users` con contraseña encriptada
  - Crear el usuario en `public.users` con los detalles necesarios
  - Devolver el ID del usuario creado
- Una función auxiliar `list_database_functions` para verificar la existencia de funciones RPC

Este script debe ejecutarse en el SQL Editor de Supabase con permisos de administrador.

### 2. Script JavaScript para usar la función RPC

Se ha creado un script Node.js (`prueba-rpc-admin.js`) que:

- Verifica si la función RPC existe
- Verifica si la organización existe
- Comprueba si el usuario ya existe
- Crea el usuario administrador asociado a la organización específica
- Guarda los resultados y proporciona información de acceso

### 3. Script alternativo para creación directa

Como solución alternativa, se creó un script (`create-admin-directly.js`) que:

- Intenta insertar directamente en `public.users` 
- Genera instrucciones SQL para la sincronización manual
- Proporciona pasos detallados para completar el proceso

### 4. Instrucciones para creación manual

Se han documentado instrucciones paso a paso (`instrucciones-crear-admin.md`) para:

1. Crear el usuario mediante la interfaz de Supabase
2. Actualizar los metadatos necesarios
3. Verificar la creación correcta
4. Probar el inicio de sesión

## Guía de uso

### Para crear un usuario administrador automáticamente:

1. Ejecutar el script SQL en Supabase:
   ```
   psql -f crear-funcion-rpc.sql
   ```
   O copiar y pegar el contenido en el SQL Editor de Supabase.

2. Ejecutar el script JavaScript:
   ```
   node prueba-rpc-admin.js
   ```

### Para crear un usuario administrador manualmente:

Sigue las instrucciones detalladas en `instrucciones-crear-admin.md`.

## Notas importantes

- **Seguridad**: Los scripts utilizan una clave de servicio de Supabase (service_role) que tiene permisos elevados. Mantenla segura y no la incluyas en código de producción expuesto públicamente.
- **Contraseñas**: Las contraseñas en estos ejemplos son demostrativas. En producción, utiliza contraseñas seguras y nunca las almacenes en texto plano.
- **Integración**: Para integrar esta funcionalidad en la aplicación principal, considera implementar una API serverless o una Edge Function de Supabase.

## Resolución de problemas

- Si la función RPC no existe o no funciona, verifica los permisos del usuario que ejecuta el SQL.
- Si hay errores de clave foránea, verifica que estás creando el usuario en `auth.users` antes que en `public.users`.
- Para verificar la existencia de la función RPC, ejecuta `node verificar-funciones-rpc.js`.

## Contacto

Para obtener asistencia adicional, contacta al equipo de desarrollo de FacilityManagerPro. 