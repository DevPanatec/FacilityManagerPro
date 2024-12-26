'use client';
import { useState, useEffect } from 'react';
import { dataHubService } from '@/services/dataHubService';
import { authService } from '@/services/authService';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    activeOrganizations: 0,
    recentImports: [],
    recentActivity: []
  });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
    loadAdminStats();
  }, []);

  // Verificación de acceso
  const checkAccess = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const role = await authService.getUserRole(user.id);
      if (role !== 'admin') {
        toast.error('Acceso no autorizado');
        window.location.href = '/';
        return;
      }

      setUserRole(role);
    } catch (error) {
      console.error('Error verificando acceso:', error);
      toast.error('Error de autenticación');
    }
  };

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const data = await dataHubService.getAdminStats();
      const activities = await dataHubService.getRecentActivities();
      
      setStats({
        ...data,
        recentActivity: activities
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          {userRole?.toUpperCase()}
        </span>
      </div>
      
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Usuarios</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Organizaciones</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalOrganizations}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Organizaciones Activas</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.activeOrganizations}</p>
        </div>
      </div>

      {/* Logs de Actividad */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Actividad Reciente</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Acción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.map((activity, index) => (
                <tr key={index} className="border-b">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{activity.user_email}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{activity.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{activity.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Importaciones Recientes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Importaciones Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Registros</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentImports.map((import_, index) => (
                <tr key={index} className="border-b">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(import_.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{import_.user}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{import_.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{import_.records}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      import_.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {import_.status === 'success' ? 'Exitoso' : 'Error'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 