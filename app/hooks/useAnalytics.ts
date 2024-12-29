import { useCallback } from 'react'
import { event, timing, error, setUserProperties } from '@/lib/gtag'

export function useAnalytics() {
  // Trackear eventos
  const trackEvent = useCallback((action: string, category: string, label: string, value?: number) => {
    event({ action, category, label, value })
  }, [])

  // Trackear tiempo
  const trackTiming = useCallback((name: string, value: number) => {
    timing(name, value)
  }, [])

  // Trackear errores
  const trackError = useCallback((description: string, fatal: boolean = false) => {
    error(description, fatal)
  }, [])

  // Establecer propiedades del usuario
  const setUserData = useCallback((properties: Record<string, any>) => {
    setUserProperties(properties)
  }, [])

  return {
    trackEvent,
    trackTiming,
    trackError,
    setUserData
  }
} 