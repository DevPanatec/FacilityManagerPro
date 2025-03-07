// server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Crear la aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configurar cliente Supabase Admin (con Service Role)
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Endpoint para crear usuarios
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, organizationId } = req.body;
    
    // Validaciones
    if (!email || !password || !firstName || !lastName || !role || !organizationId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Verificar rol válido
    const validRoles = ['superadmin', 'adminprincipal', 'admin', 'enterprise', 'usuario'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Rol inválido. Debe ser uno de: ${validRoles.join(', ')}` 
      });
    }
    
    // 1. Crear usuario con Supabase Auth Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar el email automáticamente
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      },
      app_metadata: {
        role: role,
        provider: 'email',
        providers: ['email']
      }
    });
    
    if (error) {
      console.error('Error al crear usuario en auth:', error);
      return res.status(400).json({ error: error.message });
    }
    
    // 2. Actualizar organización en public.users (por si el trigger no lo hizo)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ organization_id: organizationId })
      .eq('id', data.user.id);
    
    if (updateError) {
      console.error('Error al actualizar organización:', updateError);
      return res.status(400).json({ error: updateError.message });
    }
    
    // Éxito
    return res.status(201).json({ 
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: role
      }
    });
    
  } catch (error) {
    console.error('Error servidor:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.send('Servidor API de creación de usuarios funcionando');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
