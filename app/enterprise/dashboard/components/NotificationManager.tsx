'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AnimatedNotification, { Notification, NotificationType } from './AnimatedNotification';

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message: string, duration?: number) => void;
  showTaskCompleted: (taskName: string, roomName: string) => void;
  showTaskCreated: (taskName: string, roomName: string) => void;
  showInventoryUsed: (itemName: string, quantity: number, unit: string) => void;
  showInventoryRestocked: (itemName: string, quantity: number, unit: string) => void;
  showShiftChanged: (shift: 'morning' | 'afternoon' | 'night') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Función para mostrar una notificación
  const showNotification = (
    type: NotificationType, 
    title: string, 
    message: string, 
    duration = 5000
  ) => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, type, title, message, duration }]);
    
    // Reproducir sonido de notificación
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.error('Error playing notification sound:', err));
    
    return id;
  };

  // Funciones específicas para cada tipo de evento
  const showTaskCompleted = (taskName: string, roomName: string) => {
    return showNotification(
      'success',
      '¡Tarea Completada!',
      `La tarea "${taskName}" en ${roomName} ha sido completada exitosamente.`
    );
  };

  const showTaskCreated = (taskName: string, roomName: string) => {
    return showNotification(
      'info',
      'Nueva Tarea Asignada',
      `Se ha creado la tarea "${taskName}" para ${roomName}.`
    );
  };

  const showInventoryUsed = (itemName: string, quantity: number, unit: string) => {
    return showNotification(
      'info',
      'Inventario Actualizado',
      `Se han utilizado ${quantity} ${unit} de ${itemName}.`
    );
  };

  const showInventoryRestocked = (itemName: string, quantity: number, unit: string) => {
    return showNotification(
      'success',
      'Inventario Repuesto',
      `Se han añadido ${quantity} ${unit} de ${itemName} al inventario.`
    );
  };

  const showShiftChanged = (shift: 'morning' | 'afternoon' | 'night') => {
    const shiftNames = {
      'morning': 'Mañana (6:00 - 14:00)',
      'afternoon': 'Tarde (14:00 - 22:00)',
      'night': 'Noche (22:00 - 6:00)'
    };
    
    return showNotification(
      'warning',
      'Cambio de Turno',
      `Se ha iniciado el turno de ${shiftNames[shift]}.`,
      8000
    );
  };

  // Cerrar una notificación
  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        showNotification, 
        showTaskCompleted, 
        showTaskCreated, 
        showInventoryUsed, 
        showInventoryRestocked, 
        showShiftChanged 
      }}
    >
      {children}
      
      <div className="fixed z-50">
        {notifications.map((notification, index) => (
          <AnimatedNotification
            key={notification.id}
            notification={notification}
            onClose={closeNotification}
            position="bottom-right"
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
} 