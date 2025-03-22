'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Tipos de notificaciones
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

// Tipo de notificación
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number; // en ms
}

// Props del componente
interface AnimatedNotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export default function AnimatedNotification({ 
  notification, 
  onClose,
  position = 'bottom-right'
}: AnimatedNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Configurar el temporizador para cerrar automáticamente la notificación
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(notification.id), 300); // Dar tiempo para la animación de salida
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  // Obtener el color según el tipo de notificación
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-green-600',
          icon: notification.icon || (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          icon: notification.icon || (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          icon: notification.icon || (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          icon: notification.icon || (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
    }
  };

  // Obtener la posición CSS
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
    }
  };

  const typeStyles = getTypeStyles();
  const positionStyles = getPositionStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${positionStyles} z-50 max-w-md`}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
        >
          <div className={`${typeStyles.bg} rounded-lg shadow-xl overflow-hidden flex items-start border border-white/20`}>
            <div className="flex-shrink-0 p-4">
              {typeStyles.icon}
            </div>
            
            <div className="py-4 pr-2 flex-1 text-white">
              <h3 className="font-bold">{notification.title}</h3>
              <p className="text-sm text-white/90 mt-1">{notification.message}</p>
            </div>
            
            <button 
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(notification.id), 300);
              }}
              className="p-4"
            >
              <XMarkIcon className="h-5 w-5 text-white/80 hover:text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 