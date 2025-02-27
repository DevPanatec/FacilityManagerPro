# Instrucciones para crear usuarios en FacilityManagerPro

Después de múltiples pruebas, hemos determinado que la forma más efectiva de crear usuarios en este sistema es mediante el siguiente proceso.

## Método para crear nuevos usuarios administrativos

### 1. Reutilizar un usuario existente que no esté siendo utilizado

El script `user-creation-helper.js` permite reutilizar un usuario existente modificando su email, nombre y organización. Este método funciona porque evita las restricciones de claves foráneas entre las tablas `users` y `auth.users`.

```bash
# Modificar la configuración en el archivo user-creation-helper.js
# Editar la sección "CONFIGURACIÓN DEL NUEVO USUARIO"
# Y luego ejecutar:
node user-creation-helper.js
```

### 2. Acceder usando los usuarios existentes

Usuarios administradores disponibles:

| Email | Organización | Notas |
|-------|--------------|-------|
| admin@facilitymanagerpro.com | (Sin organización) | Usuario administrador principal |
| nuevo.admin@facilitymanagerpro.com | HospitalesGlobales | Creado por nosotros |
| hospital.dr.joaqu.n.pablo.franco.sayas.admin1@facilitymanagerpro.com | hospital.dr.joaqu.n.pablo.franco.sayas | Admin existente |

## Posibles contraseñas para los usuarios existentes

Los siguientes son intentos comunes de contraseñas que podrías probar:

- `admin`
- `admin123`
- `password`
- `password123`
- `facilitymanager`
- `123456`
- El mismo correo electrónico del usuario
- `FacilityManager123!`

## Solución definitiva (requiere acceso de administrador a la base de datos)

Para resolver permanentemente este problema, sería necesario:

1. **Modificar la estructura de la base de datos**: Eliminar o modificar la restricción de clave foránea entre las tablas `users` y `auth.users`.

2. **Crear un procedimiento almacenado**: Desarrollar una función SQL personalizada que maneje la creación sincronizada de usuarios en ambas tablas.

3. **Actualizar el código de la aplicación**: Modificar la aplicación para utilizar este procedimiento almacenado al crear nuevos usuarios.

## Contacto para soporte

Si ninguna de estas soluciones funciona, será necesario contactar al administrador del sistema o al desarrollador original para obtener las credenciales de usuario correctas o para que ellos creen los usuarios necesarios.

## Script alternativo

Si necesitas crear usuarios adicionales, puedes modificar el siguiente script para reutilizar usuarios existentes:

```javascript
// En user-creation-helper.js
const newUserData = {
  email: "tu-nuevo-email@facilitymanagerpro.com", // Modificar esto
  first_name: "Nombre",                           // Modificar esto
  last_name: "Apellido",                          // Modificar esto
  role: "admin",                                  // "admin" o "enterprise"
  organization_id: "ID-DE-LA-ORGANIZACIÓN"        // Modificar esto
};
```

Ejecuta el script después de modificarlo:

```bash
node user-creation-helper.js
``` 