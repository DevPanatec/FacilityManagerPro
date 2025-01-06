"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Chat = () => {
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Obtener permisos del localStorage
    const permissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    
    if (permissions.allChatsEnabled && permissions.fullAccess) {
      setHasFullAccess(true);
    }
  }, []);

  // Si tiene acceso total, mostrar todos los chats
  if (hasFullAccess) {
    return (
      <div>
        {/* Interfaz de chat con acceso total */}
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Panel de Chat - Acceso Total</h2>
          {/* Aquí va tu interfaz de chat con acceso total */}
        </div>
      </div>
    );
  }

  // Renderizado normal para otros usuarios
  return (
    <div>
      {/* Interfaz de chat normal */}
    </div>
  );
};

export default Chat; 