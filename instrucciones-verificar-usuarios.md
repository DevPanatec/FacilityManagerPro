# Instrucciones para Verificar Todos los Usuarios en Supabase

Para completar la verificación de todos los usuarios creados, necesitamos ejecutar un script SQL directamente en el SQL Editor de Supabase. El script se encargará de:

1. Sincronizar los usuarios que existen en `public.users` pero no en `auth.users`
2. Marcar todos los usuarios como verificados
3. Mostrar un informe de los usuarios procesados

## Pasos a seguir:

1. Accede a la [Consola de Supabase](https://app.supabase.io/)
2. Selecciona tu proyecto "Facility Manager Pro"
3. En el menú lateral, haz clic en "SQL Editor"
4. Crea un nuevo query haciendo clic en el botón "New Query" o "+"
5. Copia y pega todo el contenido del archivo `verify-users-sql.sql` en el editor
6. Ejecuta el script haciendo clic en el botón "Run" (o presiona Ctrl+Enter)

## Contraseña por defecto:

El script asigna a todos los usuarios sincronizados una contraseña por defecto:

**Password123!**

Con esta contraseña, los usuarios podrán iniciar sesión inmediatamente después de la sincronización.

## Verificación de éxito:

El script mostrará en la consola de resultados:
- Número de usuarios sincronizados desde `public.users` a `auth.users`
- Número de usuarios marcados como verificados
- Lista completa de usuarios con su estado de verificación

## Notas importantes:

- Este script debe ejecutarse con permisos de administrador en Supabase.
- La ejecución podría tomar unos segundos dependiendo del número de usuarios.
- Después de ejecutar este script, todos los usuarios deberían poder iniciar sesión sin problemas.
- Recomendamos que los usuarios cambien su contraseña después del primer inicio de sesión.

## Solución de problemas:

Si encuentras algún error durante la ejecución:

1. Verifica que tienes permisos adecuados en Supabase
2. Comprueba si hay algún mensaje de error específico en la consola de resultados
3. Asegúrate de que los nombres de las columnas en las tablas `public.users` y `auth.users` coinciden con los usados en el script
4. Si persisten los problemas, contacta con el administrador del sistema 