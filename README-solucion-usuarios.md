# Solución para la Creación de Usuarios en FacilityManagerPro

Este paquete contiene scripts y herramientas para implementar una solución completa al problema de creación de usuarios en FacilityManagerPro. La solución resuelve el ciclo de dependencia entre las tablas `users` y `auth.users` y proporciona una forma eficiente de crear múltiples usuarios.

## Contenido del Paquete

- `create-user-sql-script.sql`: Script SQL para configurar la base de datos
- `batch-create-users.js`: Script para crear múltiples usuarios en lote
- `users-to-create.csv`: Archivo CSV de ejemplo con usuarios
- `solucion-definitiva-usuarios.md`: Documento explicativo de la solución
- `README-solucion-usuarios.md`: Este archivo

## Pasos para Implementar la Solución

### 1. Instalar Dependencias

```bash
npm install @supabase/supabase-js uuid csv-parser
```

### 2. Configurar la Base de Datos

1. **Acceder al Panel de Administración de Supabase**:
   - Inicia sesión en el panel de Supabase: https://wldiefpqmfjxernvuywv.supabase.co/dashboard
   - Ve a la sección "SQL Editor" (requiere permisos de administrador)

2. **Ejecutar el Script SQL**:
   - Abre el archivo `create-user-sql-script.sql` 
   - Copia todo el contenido
   - Pégalo en el editor SQL de Supabase
   - Ejecuta el script

3. **Verificar la Instalación**:
   - Asegúrate de que todas las funciones se han creado correctamente
   - Puedes probar con una consulta: `SELECT * FROM pg_proc WHERE proname LIKE '%user_rpc%';`

### 3. Configurar el Script de Creación de Usuarios

1. **Preparar los Datos de Usuarios**:
   - Opción 1: Edita el archivo `users-to-create.csv` con los usuarios que deseas crear
   - Opción 2: Crea un archivo `users-to-create.json` siguiendo el formato de ejemplo
   - Opción 3: Modifica la lista `defaultUsersToCreate` en `batch-create-users.js`

2. **Verificar la Configuración de Supabase**:
   - Asegúrate de que las variables `supabaseUrl` y `supabaseServiceKey` en `batch-create-users.js` son correctas

### 4. Crear Usuarios

Ejecuta el script para crear los usuarios:

```bash
node batch-create-users.js
```

El script:
- Verificará la existencia de cada usuario antes de intentar crearlo
- Validará que todos los campos requeridos estén presentes
- Confirmará que la organización existe
- Creará los usuarios utilizando la función RPC
- Generará un archivo de resultados con los detalles de la operación

### 5. Verificar los Resultados

Después de ejecutar el script, se generará un archivo con los resultados (por ejemplo, `user-creation-results-2025-02-27T17-42-49.json`). Este archivo contendrá:
- Un resumen con los totales de usuarios creados, fallidos y saltados
- Listas detalladas de los usuarios procesados
- Información sobre cualquier error que haya ocurrido

### 6. Utilizar los Nuevos Usuarios

Los usuarios creados pueden iniciar sesión de inmediato con sus credenciales:

```
Email: [email configurado]
Contraseña: [contraseña configurada]
```

## Funciones Adicionales

Esta solución también proporciona funciones SQL para:

1. **Actualizar Usuarios Existentes**:
   ```sql
   SELECT update_user_rpc(
     'id-del-usuario',
     'nuevo-email@ejemplo.com',
     'Nuevo Nombre',
     'Nuevo Apellido',
     'nuevo-rol',
     'id-de-organizacion'
   );
   ```

2. **Cambiar Contraseñas**:
   ```sql
   SELECT reset_password_rpc(
     'id-del-usuario',
     'NuevaContraseña123!'
   );
   ```

3. **Eliminar Usuarios**:
   ```sql
   SELECT delete_user_rpc('id-del-usuario');
   ```

## Solución de Problemas

Si encuentras errores durante la ejecución del script SQL o al crear usuarios, verifica:

1. **Permisos**: Asegúrate de estar utilizando un usuario con permisos suficientes (service_role)
2. **Estructura de la Base de Datos**: Confirma que las tablas `users` y `auth.users` tienen la estructura esperada
3. **Restricciones**: Verifica si la restricción de clave foránea se eliminó correctamente
4. **Logs**: Revisa los mensajes de error para identificar el problema específico

## Notas Importantes

- Esta solución modifica la estructura de la base de datos y debe ser implementada por un administrador.
- La eliminación de la restricción de clave foránea no debería afectar la integridad de los datos existentes.
- Los scripts pueden personalizarse según las necesidades específicas de tu implementación.
- Recuerda mantener seguras las claves de API y las contraseñas generadas.

Para cualquier consulta adicional o soporte, contacta al administrador del sistema. 