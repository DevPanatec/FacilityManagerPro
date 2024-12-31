'use client';

export default function Register() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
            <div className="relative w-full max-w-md">
                {/* Efectos de fondo */}
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                
                {/* Card de Registro */}
                <div className="relative bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Título */}
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-gray-800">
                            Crear Cuenta
                        </h2>
                        <p className="text-gray-500">
                            Ingresa los datos para el nuevo usuario
                        </p>
                    </div>

                    {/* Formulario */}
                    <form className="space-y-6">
                        {/* Nombre Completo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo
                            </label>
                            <input
                                type="text"
                                placeholder="Ingresa nombre completo"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                            />
                        </div>

                        {/* Correo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                            />
                        </div>

                        {/* Usuario */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Usuario
                            </label>
                            <input
                                type="text"
                                placeholder="Nombre de usuario"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                            />
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                placeholder="Ingresa una contraseña segura"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                            />
                        </div>

                        {/* Confirmar Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                placeholder="Confirma tu contraseña"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                            />
                        </div>

                        {/* Rol o Tipo de Usuario */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rol de Usuario
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50">
                                <option value="">Selecciona un rol</option>
                                <option value="admin">Administrador</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="user">Usuario Regular</option>
                            </select>
                        </div>

                        {/* Botones */}
                        <div className="space-y-4">
                            <button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium
                                         hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                         transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            >
                                Crear Usuario
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => window.history.back()}
                                className="w-full bg-gray-50 text-gray-700 py-3 rounded-lg font-medium border border-gray-300
                                         hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                                         transform transition-all duration-200"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
