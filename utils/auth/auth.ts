import { users, User } from './users';

export function findUserByEmail(email: string): User | undefined {
    return users.find(user => user.email === email);
}

export function validateUserCredentials(email: string, password: string): User | null {
    const user = findUserByEmail(email);
    if (user && user.password === password) {
        return user;
    }
    return null;
}

export function getUserById(id: string): User | undefined {
    return users.find(user => user.id === id);
}

export function isUserAuthorized(user: User | null, requiredRoles: string[]): boolean {
    if (!user) return false;
    return requiredRoles.includes(user.role);
}

// Manejo de sesión usando localStorage
export function setSession(user: User) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('session', JSON.stringify({ user }));
    }
}

export function getSession(): { user: User } | null {
    if (typeof window === 'undefined') {
        return null;
    }
    
    const sessionData = localStorage.getItem('session');
    if (!sessionData) {
        return null;
    }

    try {
        return JSON.parse(sessionData);
    } catch {
        return null;
    }
}

export function clearSession() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('session');
    }
}

// Middleware de autenticación
export async function withAuth(handler: Function, requiredRoles?: string[]) {
    const session = getSession();
    
    if (!session) {
        throw new Error('No autenticado');
    }

    if (requiredRoles && !isUserAuthorized(session.user, requiredRoles)) {
        throw new Error('No autorizado');
    }

    return handler();
} 