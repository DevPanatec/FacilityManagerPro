# Solución al Problema de Schemas en Supabase

## Problema Identificado

Se detectó un problema importante en nuestra aplicación al intentar acceder directamente al schema `auth` de Supabase, particularmente a la tabla `auth.users`. Este problema se manifestaba en varios scripts donde intentábamos:

1. **Consultar directamente** la tabla `auth.users` usando `from('auth.users')`
2. **Insertar o actualizar** registros directamente en `auth.users`
3. **Uso inconsistente** de referencias a las tablas (`auth.users` vs `users`)

**Causa del problema**: Supabase no permite el acceso directo al schema `auth` a través de la API de datos. Este schema es interno y está gestionado exclusivamente por Supabase.

## Solución Implementada

### 1. Trigger de Sincronización

Hemos creado triggers en la base de datos para sincronizar automáticamente los datos entre `auth.users` y nuestra tabla personalizada `public.users`:

```sql
-- Archivo: create-user-sync-trigger.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Este trigger se ejecuta automáticamente cuando se crea un usuario en `auth.users`, insertando una fila correspondiente en `public.users`.

### 2. Método Correcto para Verificar Usuarios

En lugar de consultar directamente `auth.users`, ahora verificamos la existencia de usuarios a través de:

```javascript
// Verificar mediante public.users
const { data, error } = await supabase
  .from('users')
  .select('id, email')
  .eq('email', email)
  .maybeSingle();
```

### 3. Método Correcto para Crear Usuarios

En lugar de insertar directamente en `auth.users`, ahora usamos la API oficial:

```javascript
// Crear usuario mediante la API de Auth
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: userData.email,
  password: userData.password,
  email_confirm: true,
  user_metadata: {
    first_name: userData.first_name,
    last_name: userData.last_name
  }
});
```

## Archivos de Ejemplo

1. **create-user-sync-trigger.sql**: Contiene los triggers para sincronizar los datos de usuario
2. **correct-user-verification.js**: Ejemplo de cómo verificar usuarios correctamente
3. **correct-user-creation.js**: Ejemplo de cómo crear usuarios correctamente

## Instrucciones de Implementación

### Paso 1: Ejecutar los Triggers

1. Abre el SQL Editor en el panel de control de Supabase
2. Copia y pega el contenido de `create-user-sync-trigger.sql`
3. Ejecuta la consulta

### Paso 2: Actualizar Scripts Existentes

Revisa y actualiza todos los scripts existentes que intenten acceder directamente a `auth.users`:

1. Reemplaza las consultas a `auth.users` con consultas a `public.users`
2. Reemplaza las inserciones en `auth.users` con llamadas a `supabaseAdmin.auth.admin.createUser()`
3. Reemplaza las actualizaciones en `auth.users` con llamadas a `supabaseAdmin.auth.admin.updateUser()`

## Recursos Adicionales

- [Documentación oficial de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Ejemplo de gestión de usuarios en Supabase](https://supabase.com/docs/guides/auth/managing-user-data)

## Notas Importantes

- **NUNCA** intentes acceder directamente al schema `auth`
- Usa **SIEMPRE** los métodos oficiales de la API para crear, actualizar o eliminar usuarios
- El schema `auth` es gestionado internamente por Supabase y puede cambiar sin previo aviso

Por cualquier duda o problema adicional, consulta la documentación oficial o abre un issue en nuestro repositorio. 