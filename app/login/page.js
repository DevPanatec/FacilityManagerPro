"use client";

import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (isLoading) return;
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const username = formData.get('username');
      const password = formData.get('password');

      if (!username || !password) {
        toast.error("Por favor complete todos los campos");
        return;
      }

      if (username === "SuperAdmin") {
        try {
          // Intentar autenticación
          const userCredential = await signInWithEmailAndPassword(
            auth,
            "admin@hombresdeblanco.com",
            password
          );

          // Verificar datos del usuario
          const userSnapshot = await getDoc(doc(db, "users", userCredential.user.uid));
          
          if (!userSnapshot.exists()) {
            throw new Error("Usuario no encontrado");
          }

          const userData = userSnapshot.data();

          if (userData.role !== "super_admin") {
            throw new Error("Acceso no autorizado");
          }

          // Obtener token
          const idToken = await userCredential.user.getIdToken();

          // Crear sesión
          const sessionResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken,
              role: "super_admin",
              permissions: userData.permissions
            }),
            credentials: 'include'
          });

          if (!sessionResponse.ok) {
            throw new Error("Error al crear la sesión");
          }

          // Guardar permisos
          localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
          
          // Notificar y redirigir
          toast.success('Bienvenido Super Administrador');
          router.push('/admin');

        } catch (authError) {
          console.error("Error de autenticación:", authError);
          if (authError.code === 'auth/wrong-password') {
            toast.error("Contraseña incorrecta");
          } else if (authError.code === 'auth/too-many-requests') {
            toast.error("Demasiados intentos. Intente más tarde");
          } else {
            toast.error(authError.message || "Error de autenticación");
          }
        }
      } else {
        toast.error("Usuario no autorizado");
      }

    } catch (error) {
      console.error("Error en login:", error);
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-8">Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="SuperAdmin"
              defaultValue="SuperAdmin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contraseña"
              defaultValue="123456"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
} 