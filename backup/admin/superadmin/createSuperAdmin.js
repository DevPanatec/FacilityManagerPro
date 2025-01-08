"use client";

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const createSuperAdmin = async (email, password) => {
    try {
        // Registrar el usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'superadmin',
                }
            }
        });

        if (authError) throw authError;

        // Crear el registro en la tabla de superadmins
        const { data: profileData, error: profileError } = await supabase
            .from('superadmins')
            .insert([
                {
                    user_id: authData.user.id,
                    email: email,
                    role: 'superadmin',
                    created_at: new Date().toISOString()
                }
            ]);

        if (profileError) throw profileError;

        return { success: true, data: authData };
    } catch (error) {
        console.error('Error creating super admin:', error);
        throw error;
    }
};

const CreateSuperAdminForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createSuperAdmin(email, password);
            toast.success('Super Admin creado exitosamente');
            setEmail('');
            setPassword('');
        } catch (error) {
            toast.error(error.message || 'Error al crear Super Admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Crear Super Admin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                             disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creando...' : 'Crear Super Admin'}
                </button>
            </form>
        </div>
    );
};

export default CreateSuperAdminForm; 