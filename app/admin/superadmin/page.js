'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import CreateSuperAdminForm from './createSuperAdmin';
import { toast } from 'react-hot-toast';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SuperAdminPage() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar la sesión actual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Escuchar cambios en la autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Verificar si el usuario es superadmin
    const isSuperAdmin = session?.user?.user_metadata?.role === 'superadmin';

    if (!session || !isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
                    <p className="text-gray-600">
                        No tienes permisos para acceder a esta página.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Panel de Super Administrador
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Crear Nuevo Super Admin</h2>
                        <CreateSuperAdminForm />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
                        {/* Aquí puedes agregar estadísticas o información adicional */}
                    </div>
                </div>
            </div>
        </div>
    );
} 