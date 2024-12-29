// Restaurar configuración de Google Analytics
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID!, {
    page_path: url,
  })
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: any) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Tiempo de sesión
export const timing = (name: string, value: number) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'timing_complete', {
      name,
      value,
      event_category: 'Performance',
    })
  }
}

// Error tracking
export const error = (description: string, fatal: boolean = false) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'exception', {
      description,
      fatal,
    })
  }
}

// User Properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('set', 'user_properties', properties)
  }
} 