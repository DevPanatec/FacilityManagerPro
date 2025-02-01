import { create } from 'zustand';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id },
      ],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export const useToast = () => {
  const { addToast, removeToast } = useToastStore();

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = addToast(toast);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  return { showToast };
};

export { useToastStore }; 