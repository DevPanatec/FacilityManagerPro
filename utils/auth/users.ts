export type UserRole = 'enterprise' | 'admin' | 'superadmin';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    password: string;
}

export const users: User[] = [
    {
        id: 'enterprise-1',
        email: 'hospital@sanmiguel.com',
        name: 'Hospital San Miguel Arcángel',
        role: 'enterprise',
        password: 'hospital123'
    },
    {
        id: 'admin-1',
        email: 'admin1@admin.com',
        name: 'Admin1',
        role: 'admin',
        password: 'admin123'
    },
    {
        id: 'admin-2',
        email: 'admin2@admin.com',
        name: 'Admin2',
        role: 'admin',
        password: 'admin123'
    },
    {
        id: 'admin-3',
        email: 'admin3@admin.com',
        name: 'Admin3',
        role: 'admin',
        password: 'admin123'
    },
    {
        id: 'superadmin-1',
        email: 'superadmin1@admin.com',
        name: 'Superadmin1',
        role: 'superadmin',
        password: 'super123'
    },
    {
        id: 'superadmin-2',
        email: 'superadmin2@admin.com',
        name: 'Superadmin2',
        role: 'superadmin',
        password: 'super123'
    }
]; 