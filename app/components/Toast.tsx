'use client';

import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';

// Import the store
import { useToastStore } from '@/app/hooks/useToast';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const toastTypeConfig = {
  success: {
    icon: FiCheckCircle,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-400',
  },
  error: {
    icon: FiAlertCircle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-400',
  },
  warning: {
    icon: FiAlertCircle,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-400',
  },
  info: {
    icon: FiInfo,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-400',
  },
};

export default function Toast({ id, title, description, type, onClose }: ToastProps) {
  const config = toastTypeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-md border ${config.borderColor}`}
    >
      <div className={`flex items-center justify-center w-12 ${config.bgColor}`}>
        <Icon className={`w-6 h-6 ${config.textColor}`} />
      </div>

      <div className="px-4 py-2 -mx-3">
        <div className="mx-3">
          <span className={`font-semibold ${config.textColor}`}>{title}</span>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-1 ml-auto mr-2 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300"
      >
        <FiX className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
} 