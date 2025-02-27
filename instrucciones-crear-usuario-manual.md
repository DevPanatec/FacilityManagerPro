# Instrucciones para Crear Usuarios Manualmente en Supabase

Debido a las restricciones en la base de datos, es necesario crear los usuarios manualmente a través de la interfaz de Supabase y luego vincularlos a la tabla `users` mediante actualizaciones.

## Paso 1: Crear Usuario en Supabase Authentication

1. Inicia sesión en la consola de Supabase: https://wldiefpqmfjxernvuywv.supabase.co/dashboard
2. Ve a la sección "Authentication" en el menú lateral
3. Haz clic en la pestaña "Users"
4. Haz clic en el botón "Add User" en la esquina superior derecha
5. Completa el formulario con la siguiente información:
   - Email: [Email del usuario]
   - Password: [Contraseña segura]
   - Marca la casilla "Auto confirm user" para que el usuario no tenga que confirmar su email

## Paso 2: Vincular el Usuario a la tabla 'users'

Después de crear el usuario en Authentication, es necesario vincularlo a la tabla `users`:

1. Ve a la sección "Table Editor" en el menú lateral
2. Selecciona la tabla "users"
3. Haz clic en "Insert" para agregar un nuevo registro
4. Completa los campos con la información del usuario:
   - id: [Copia el ID del usuario que acabas de crear en Authentication]
   - email: [El mismo email del paso anterior]
   - first_name: [Nombre del usuario]
   - last_name: [Apellido del usuario]
   - role: 'admin' o 'enterprise' según corresponda
   - organization_id: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584' (para HospitalesGlobales)
   - status: 'active'
   - timezone: 'UTC'
   - language: 'es'
   - metadata: {}
   - failed_login_attempts: 0
5. Haz clic en "Save" para guardar el registro

## Usuarios a Crear

Los siguientes usuarios deben ser creados según este proceso:

### Administradores

1. **Patricia Mendoza**
   - Email: admin1@hospitalintegrado.com
   - Contraseña: AdminHospital123!
   - Rol: admin
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

2. **Carlos Rivera**
   - Email: admin2@hospitalintegrado.com
   - Contraseña: AdminHospital123!
   - Rol: admin
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

3. **Laura Castillo**
   - Email: admin3@hospitalintegrado.com
   - Contraseña: AdminHospital123!
   - Rol: admin
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

4. **Roberto Jiménez**
   - Email: admin4@hospitalintegrado.com
   - Contraseña: AdminHospital123!
   - Rol: admin
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

5. **María González**
   - Email: admin5@hospitalintegrado.com
   - Contraseña: AdminHospital123!
   - Rol: admin
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

### Coordinadores

1. **Fernando Vargas**
   - Email: coordinador1@hospitalintegrado.com
   - Contraseña: CoordHospital123!
   - Rol: enterprise
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

2. **Ana Martínez**
   - Email: coordinador2@hospitalintegrado.com
   - Contraseña: CoordHospital123!
   - Rol: enterprise
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

3. **Jorge Sánchez**
   - Email: coordinador3@hospitalintegrado.com
   - Contraseña: CoordHospital123!
   - Rol: enterprise
   - Organización: HospitalesGlobales (0d7f71d0-1b5f-473f-a3d5-68c3abf99584)

## Verificación

Después de crear cada usuario:

1. Intenta iniciar sesión en la aplicación con las credenciales del usuario
2. Verifica que el usuario tenga los permisos correspondientes a su rol
3. Verifica que el usuario esté asociado a la organización correcta

## Solución a largo plazo

Para resolver este problema de manera permanente, será necesario que un administrador de base de datos:

1. Analice las restricciones específicas que impiden la creación automática de usuarios
2. Modifique la estructura de la base de datos para permitir la creación programática
3. Implemente funciones personalizadas que manejen la creación sincronizada de usuarios en ambas tablas 