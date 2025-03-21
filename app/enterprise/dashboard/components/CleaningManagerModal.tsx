'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CleaningManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerName: string;
  shift: 'morning' | 'afternoon' | 'night';
  staffCount?: number;
  areasCount?: number;
  tasksCount?: number;
  isShiftChangingSoon?: boolean;
}

export default function CleaningManagerModal({ 
  isOpen, 
  onClose, 
  managerName, 
  shift,
  staffCount = 0,
  areasCount = 0,
  tasksCount = 0,
  isShiftChangingSoon = false
}: CleaningManagerModalProps) {
  // Traducir el turno a español
  const shiftNames = {
    morning: 'Mañana',
    afternoon: 'Tarde',
    night: 'Noche'
  };

  // Determinar color según el turno
  const shiftColors = {
    morning: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: 'bg-blue-100',
      iconText: 'text-blue-600'
    },
    afternoon: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: 'bg-green-100',
      iconText: 'text-green-600'
    },
    night: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: 'bg-purple-100',
      iconText: 'text-purple-600'
    }
  };

  // Animaciones para los elementos del modal
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 500,
        staggerChildren: 0.07,
        delayChildren: 0.15
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20, 
      transition: { 
        duration: 0.2,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      transition: { 
        duration: 0.2 
      } 
    }
  };

  // Generar iniciales para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl z-50 p-8 max-w-sm w-full border border-gray-100"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="text-right">
              <motion.button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            <div className="text-center mb-6">
              <motion.div 
                className={`w-28 h-28 rounded-full ${shiftColors[shift].icon} mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg`}
                variants={itemVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                animate={{ 
                  boxShadow: ["0px 0px 0px rgba(0,0,0,0.1)", "0px 0px 20px rgba(0,0,0,0.2)", "0px 0px 0px rgba(0,0,0,0.1)"],
                  transition: { duration: 2, repeat: Infinity }
                }}
              >
                <span className={`text-3xl font-bold ${shiftColors[shift].iconText}`}>
                  {getInitials(managerName)}
                </span>
              </motion.div>
              
              <motion.h3 className="text-lg font-semibold text-gray-700 mb-1" variants={itemVariants}>
                Jefa de Limpieza
              </motion.h3>
              
              <motion.p 
                className="text-2xl font-bold mb-4 text-gray-900"
                variants={itemVariants}
              >
                {managerName}
              </motion.p>
              
              <div className="relative inline-block">
                <motion.div 
                  className={`inline-block px-4 py-1.5 rounded-full border ${shiftColors[shift].bg} ${shiftColors[shift].text} ${shiftColors[shift].border}`}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-sm font-medium">Turno de {shiftNames[shift]}</span>
                </motion.div>
                
                {isShiftChangingSoon && (
                  <motion.div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(239, 68, 68, 0.7)',
                        '0 0 0 10px rgba(239, 68, 68, 0)',
                        '0 0 0 0 rgba(239, 68, 68, 0)'
                      ]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'loop' as const
                    }}
                  />
                )}
              </div>
            </div>
            
            <motion.div 
              className="pt-5 border-t border-gray-200"
              variants={itemVariants}
            >
              <p className="text-sm text-gray-500 text-center mb-4">
                Responsable de supervisar las actividades de limpieza y mantenimiento del turno actual.
              </p>
              
              <motion.div 
                className="mt-4 grid grid-cols-3 gap-3 text-center"
                variants={itemVariants}
              >
                <div className={`p-3 ${shiftColors[shift].bg} rounded-lg`}>
                  <p className="text-xs text-gray-600 mb-1">Personal</p>
                  <p className={`text-lg font-semibold ${shiftColors[shift].text}`}>{staffCount}</p>
                </div>
                <div className={`p-3 ${shiftColors[shift].bg} rounded-lg`}>
                  <p className="text-xs text-gray-600 mb-1">Áreas</p>
                  <p className={`text-lg font-semibold ${shiftColors[shift].text}`}>{areasCount}</p>
                </div>
                <div className={`p-3 ${shiftColors[shift].bg} rounded-lg`}>
                  <p className="text-xs text-gray-600 mb-1">Tareas</p>
                  <p className={`text-lg font-semibold ${shiftColors[shift].text}`}>{tasksCount}</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-6 flex justify-center"
                variants={itemVariants}
              >
                <button
                  className={`px-6 py-2.5 rounded-lg ${shiftColors[shift].bg} ${shiftColors[shift].text} border ${shiftColors[shift].border} hover:shadow-lg transition-shadow font-medium`}
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 