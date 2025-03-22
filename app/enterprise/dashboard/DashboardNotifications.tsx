'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Tipos de notificaciones
type NotificationType = 'success' | 'info' | 'warning' | 'error';

// Estructura de una notificación
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // en ms
}

// Context para las notificaciones
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, title: string, message: string, duration?: number) => void;
  // Helpers específicos
  showTaskCompleted: (taskName: string, roomName: string) => void;
  showTaskCreated: (taskName: string, roomName: string) => void;
  showInventoryUsed: (itemName: string, quantity: number, unit: string) => void;
  showInventoryRestocked: (itemName: string, quantity: number, unit: string) => void;
  showShiftChanged: (shift: 'morning' | 'afternoon' | 'night') => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export function DashboardNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Agregar una nueva notificación
  const showNotification = (
    type: NotificationType, 
    title: string, 
    message: string, 
    duration = 5000
  ) => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, type, title, message, duration }]);
    
    return id;
  };

  // Remover una notificación por su ID
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Configurar eliminación automática basada en la duración
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  // Funciones de ayuda para los diferentes tipos de eventos
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
      'Inventario Utilizado',
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

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications,
        showNotification, 
        showTaskCompleted, 
        showTaskCreated, 
        showInventoryUsed, 
        showInventoryRestocked, 
        showShiftChanged 
      }}
    >
      {children}
      
      {/* Contenedor de notificaciones */}
      <div className="fixed bottom-4 right-4 z-50 space-y-4 max-w-md">
        <AnimatePresence>
          {notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onClose={removeNotification} 
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

// Componente individual de notificación
function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: Notification; 
  onClose: (id: string) => void 
}) {
  // Obtener el color según el tipo de notificación
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-green-600',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="relative"
    >
      <div className={`${typeStyles.bg} rounded-lg shadow-xl overflow-hidden flex items-start pr-2 border border-white/20`}>
        <div className="flex-shrink-0 p-4">
          {typeStyles.icon}
        </div>
        
        <div className="py-4 pr-2 flex-1 text-white">
          <h3 className="font-bold">{notification.title}</h3>
          <p className="text-sm text-white/90 mt-1">{notification.message}</p>
        </div>
        
        <button 
          onClick={() => onClose(notification.id)}
          className="p-4"
        >
          <XMarkIcon className="h-5 w-5 text-white/80 hover:text-white" />
        </button>
      </div>
    </motion.div>
  );
} 