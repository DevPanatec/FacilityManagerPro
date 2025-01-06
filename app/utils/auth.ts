// Usuarios predefinidos
export const users = [
  // Superadmins
  {
    id: '1',
    email: 'superadmin1@facility.com',
    password: 'SuperAdmin123!',
    role: 'superadmin',
    firstName: 'Super',
    lastName: 'Admin One'
  },
  {
    id: '2',
    email: 'superadmin2@facility.com',
    password: 'SuperAdmin123!',
    role: 'superadmin',
    firstName: 'Super',
    lastName: 'Admin Two'
  },
  // Admins
  {
    id: '3',
    email: 'admin1@facility.com',
    password: 'Admin123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'One'
  },
  {
    id: '4',
    email: 'admin2@facility.com',
    password: 'Admin123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Two'
  },
  {
    id: '5',
    email: 'admin3@facility.com',
    password: 'Admin123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Three'
  },
  // Enterprise
  {
    id: '6',
    email: 'enterprise1@facility.com',
    password: 'Enterprise123!',
    role: 'enterprise',
    firstName: 'Enterprise',
    lastName: 'One'
  }
]

export type User = typeof users[0]

// Función para verificar credenciales
export function verifyCredentials(email: string, password: string): User | null {
  const user = users.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password
  )
  return user || null
}

// Función para obtener el path de redirección según el rol
export function getRedirectPath(role: string): string {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/dashboard'
    case 'enterprise':
      return '/enterprise/dashboard'
    default:
      return '/user/dashboard'
  }
}

// Función para guardar la sesión en localStorage
export function saveSession(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }))
  }
}

// Función para obtener la sesión actual
export function getSession(): User | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('user')
    return data ? JSON.parse(data) : null
  }
  return null
}

// Función para cerrar sesión
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
} 