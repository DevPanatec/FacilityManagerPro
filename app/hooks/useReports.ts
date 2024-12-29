import { useAnalytics } from './useAnalytics'

export function useReports() {
  const { trackEvent } = useAnalytics()

  const createReport = async (data) => {
    const response = await fetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    const json = await response.json()

    // Trackear evento si existe
    if (json.analytics) {
      trackEvent(
        json.analytics.event,
        json.analytics.category,
        json.analytics.label,
        json.analytics.value
      )
    }

    return json
  }

  return { createReport }
} 