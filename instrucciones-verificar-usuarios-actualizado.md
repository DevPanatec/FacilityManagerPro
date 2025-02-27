# Instrucciones para Completar la Verificación de Usuarios en Supabase

## Estado Actual:
✅ **Completado**: La tabla `public.users` ha sido actualizada exitosamente. Todos los 8 usuarios ahora tienen el estado "active".

⏳ **Pendiente**: Sincronización de usuarios entre `public.users` y `auth.users` para permitir el inicio de sesión.

## Pasos Restantes:

### 1. Ejecutar el Script SQL en Supabase:

Para completar la verificación de todos los usuarios y permitir que inicien sesión, es necesario ejecutar el script SQL `verify-users-sql.sql` en el SQL Editor de Supabase. Este script:

- Sincronizará los usuarios que existen en `public.users` pero no en `auth.users`
- Marcará todos los usuarios como verificados en la tabla `auth.users`
- Asignará una contraseña por defecto a los usuarios sincronizados
- Mostrará un informe de los usuarios procesados

#### Instrucciones para ejecutar el SQL:

1. Accede a la [Consola de Supabase](https://app.supabase.io/)
2. Selecciona tu proyecto "Facility Manager Pro"
3. En el menú lateral, haz clic en "SQL Editor"
4. Crea un nuevo query haciendo clic en el botón "New Query" o "+"
5. Copia y pega todo el contenido del archivo `verify-users-sql.sql` en el editor
6. Ejecuta el script haciendo clic en el botón "Run" (o presiona Ctrl+Enter)

### 2. Verificar Resultados del SQL:

Después de ejecutar el script SQL, verifica los resultados en la consola del SQL Editor. Debería mostrarte:

- Número de usuarios sincronizados desde `public.users` a `auth.users`
- Número de usuarios marcados como verificados
- Lista completa de usuarios con su estado de verificación

### 3. Probar el Inicio de Sesión:

Una vez completado el SQL, puedes probar si los usuarios pueden iniciar sesión usando la página HTML `verificar-login-browser.html`:

1. Abre el archivo `verificar-login-browser.html` en un navegador web
2. Selecciona un usuario de la lista
3. La contraseña predeterminada es: **Password123!**
4. Haz clic en "Verificar Login" para comprobar si el inicio de sesión funciona

## Notas Importantes:

- La contraseña por defecto que se establece en el script SQL para todos los usuarios sincronizados es: **Password123!**
- El script SQL debe ejecutarse con permisos de administrador en Supabase
- Si encuentras algún error durante la ejecución del SQL, verifica los mensajes de error específicos en la consola
- Recomendamos que los usuarios cambien su contraseña después del primer inicio de sesión

## Solución de Problemas:

Si después de ejecutar el SQL siguen habiendo problemas:

1. Verifica que no hay errores en la ejecución del script SQL
2. Comprueba si los usuarios existen tanto en la tabla `public.users` como en `auth.users`
3. Asegúrate de que la contraseña utilizada para iniciar sesión sea la correcta
4. Si persisten los problemas, considera contactar al administrador del sistema para revisar la configuración de Supabase

## Conclusión:

Una vez completados todos estos pasos, todos los usuarios deberían poder iniciar sesión sin problemas. El sistema estará listo para ser utilizado con todos los usuarios verificados. 