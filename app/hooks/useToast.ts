import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  title: string
  message?: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id,
          duration: toast.duration || 3000
        }
      ]
    }))
    return id
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}))

export const useToast = () => {
  const { addToast, removeToast } = useToastStore()

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = addToast(toast)
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 3000)
  }

  return { showToast }
}

export { useToastStore } 
