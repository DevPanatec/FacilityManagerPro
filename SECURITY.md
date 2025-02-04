# Guía de Seguridad - FacilityManagerPro

## Configuración de Variables de Entorno

### 1. Configuración Inicial
1. Copia `.env.example` a un nuevo archivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Nunca comitees archivos `.env` al repositorio
3. Actualiza las variables en `.env.local` con tus valores reales

### 2. Variables de Entorno Requeridas
- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio de Supabase (¡mantener segura!)

### 3. Gestión de Secretos
- Usa Vercel para gestionar variables de producción
- Rota las claves regularmente (cada 90 días recomendado)
- Nunca expongas las claves de servicio al cliente
- Usa variables de entorno diferentes para desarrollo y producción

## Mejores Prácticas de Seguridad

### 1. Autenticación
- Usa siempre tokens JWT para autenticación
- Implementa límites de intentos de inicio de sesión
- Configura políticas de contraseñas seguras
- Habilita autenticación de dos factores cuando sea posible

### 2. Autorización
- Implementa RBAC (Control de Acceso Basado en Roles)
- Verifica permisos en cada endpoint
- Nunca confíes en la autorización solo del lado del cliente

### 3. Manejo de Datos
- Sanitiza todas las entradas de usuario
- Usa consultas parametrizadas para prevenir SQL injection
- Encripta datos sensibles en reposo
- Implementa backups regulares

### 4. API y Endpoints
- Usa HTTPS para todas las comunicaciones
- Implementa rate limiting
- Valida todos los inputs
- Usa CORS apropiadamente

## Proceso de Rotación de Credenciales

### 1. Supabase
1. Accede al dashboard de Supabase
2. Ve a Project Settings > API
3. Genera nuevas claves
4. Actualiza las variables de entorno en Vercel
5. Verifica que todo funcione correctamente
6. Revoca las claves antiguas

### 2. Otros Servicios (si aplica)
- Sigue un proceso similar para otros servicios (AWS, SendGrid, etc.)
- Documenta cada rotación de credenciales
- Mantén un calendario de rotación

## Reporte de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad, por favor:
1. No la expongas públicamente
2. Envía un reporte detallado al equipo de seguridad
3. Proporciona pasos para reproducir el problema
4. Si es posible, sugiere una solución

## Contacto

Para reportar problemas de seguridad, contacta a:
- Email: [EMAIL DEL EQUIPO DE SEGURIDAD]
- Canal seguro: [MÉTODO DE CONTACTO SEGURO]

---

Última actualización: [FECHA] 