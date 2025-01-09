export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'enterprise' | 'admin' | 'superadmin'
  organization_id: string
}

export const HARDCODED_USERS: User[] = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    organization_id: '1'
  },
  {
    id: '2',
    name: 'Superadmin',
    email: 'superadmin@example.com',
    password: 'super123',
    role: 'superadmin',
    organization_id: '1'
  },
  {
    id: '3',
    name: 'Enterprise',
    email: 'enterprise@example.com',
    password: 'enterprise123',
    role: 'enterprise',
    organization_id: '1'
  }
] 