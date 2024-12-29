'use client';

import { useState } from 'react';
import QRCode from 'qrcode.react';
import { AuthService } from '@/lib/auth/authService';

export default function TwoFactorSetup({ userId }: { userId: string }) {
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const authService = new AuthService();

  const handleSetup = async () => {
    const data = await authService.setup2FA(userId);
    setSetupData(data);
  };

  const handleVerify = async () => {
    const isValid = await authService.verify2FA(userId, verificationCode);
    if (isValid) {
      setIsEnabled(true);
      // Actualizar estado en la base de datos
      // ... código de actualización
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Configuración de Autenticación de Dos Factores</h2>
      
      {!setupData ? (
        <button
          onClick={handleSetup}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Configurar 2FA
        </button>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <QRCode value={setupData.qrCode} size={200} />
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Escanea el código QR con tu aplicación de autenticación</p>
            <p className="mt-2">O ingresa esta clave manualmente:</p>
            <code className="block bg-gray-100 p-2 mt-1">{setupData.secret}</code>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Código de verificación
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Ingresa el código de 6 dígitos"
            />
          </div>

          <button
            onClick={handleVerify}
            className="w-full bg-green-500 text-white px-4 py-2 rounded"
          >
            Verificar y Activar
          </button>

          {isEnabled && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded">
              ¡2FA activado correctamente!
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-medium">Códigos de respaldo:</h3>
            <div className="bg-gray-50 p-2 mt-2 text-sm">
              {setupData.backupCodes.map((code: string) => (
                <div key={code} className="font-mono">{code}</div>
              ))}
            </div>
            <p className="text-sm text-red-600 mt-2">
              Guarda estos códigos en un lugar seguro. Los necesitarás si pierdes acceso a tu dispositivo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 