import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        const userPermissions = localStorage.getItem('userPermissions');
        
        if (userRole) {
            try {
                const permissions = userPermissions ? JSON.parse(userPermissions) : {};
                setUser({
                    role: userRole,
                    permissions: permissions
                });
                console.log('Auth Hook - Permisos cargados:', permissions);
            } catch (error) {
                console.error('Error parsing permissions:', error);
                setUser({
                    role: userRole,
                    permissions: {}
                });
            }
        }
    }, []);

    return { user, isLoading: user === null };
}; 