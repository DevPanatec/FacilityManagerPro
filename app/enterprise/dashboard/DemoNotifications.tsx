'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Tipos de notificaciones
type NotificationType = 'success' | 'info' | 'warning' | 'error';

// Interface para definir la estructura de una notificación
interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
}

export default function DemoNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Efecto para mostrar notificaciones de demostración
  useEffect(() => {
    // Ejemplos de notificaciones
    const demoNotifications = [
      {
        id: 1,
        type: 'success' as NotificationType,
        title: '¡Tarea Completada!',
        message: 'La tarea "Limpieza de piso" en Sala 101 ha sido completada exitosamente.',
        delay: 3000,
      },
      {
        id: 2,
        type: 'info' as NotificationType,
        title: 'Inventario Utilizado',
        message: 'Se han utilizado 2 litros de Jabón líquido.',
        delay: 7000,
      },
      {
        id: 3,
        type: 'success' as NotificationType,
        title: 'Inventario Repuesto',
        message: 'Se han añadido 10 rollos de Papel higiénico al inventario.',
        delay: 11000,
      },
      {
        id: 4,
        type: 'warning' as NotificationType,
        title: 'Cambio de Turno',
        message: 'Se ha iniciado el turno de Tarde (14:00 - 22:00).',
        delay: 15000,
      }
    ];
    
    // Limpiar notificaciones al montar
    setNotifications([]);
    
    // Programar la aparición de cada notificación
    const timers: NodeJS.Timeout[] = [];
    
    demoNotifications.forEach(demo => {
      const timer = setTimeout(() => {
        setNotifications(prev => [
          ...prev, 
          { ...demo, isVisible: true }
        ]);
        
        // Programar la desaparición después de 5 segundos
        const hideTimer = setTimeout(() => {
          setNotifications(prev => 
            prev.map(item => 
              item.id === demo.id 
                ? { ...item, isVisible: false } 
                : item
            )
          );
          
          // Eliminar por completo después de la animación
          setTimeout(() => {
            setNotifications(prev => 
              prev.filter(item => item.id !== demo.id)
            );
          }, 500);
        }, 5000);
        
        timers.push(hideTimer);
      }, demo.delay);
      
      timers.push(timer);
    });
    
    // Limpiar todos los timers al desmontar
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Función para cerrar manualmente una notificación
  const handleClose = (id: number) => {
    setNotifications(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, isVisible: false } 
          : item
      )
    );
    
    // Eliminar por completo después de la animación
    setTimeout(() => {
      setNotifications(prev => 
        prev.filter(item => item.id !== id)
      );
    }, 500);
  };
  
  // Obtener los estilos según el tipo de notificación
  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
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
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-4 max-w-md">
      <AnimatePresence>
        {notifications.map(notification => {
          const styles = getTypeStyles(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={notification.isVisible ? 
                { opacity: 1, y: 0, scale: 1 } : 
                { opacity: 0, y: -20, scale: 0.95 }
              }
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative"
            >
              <div className={`${styles.bg} rounded-lg shadow-xl overflow-hidden flex items-start pr-2 border border-white/20`}>
                <div className="flex-shrink-0 p-4">
                  {styles.icon}
                </div>
                
                <div className="py-4 pr-2 flex-1 text-white">
                  <h3 className="font-bold">{notification.title}</h3>
                  <p className="text-sm text-white/90 mt-1">{notification.message}</p>
                </div>
                
                <button 
                  onClick={() => handleClose(notification.id)}
                  className="p-4"
                >
                  <XMarkIcon className="h-5 w-5 text-white/80 hover:text-white" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
} 