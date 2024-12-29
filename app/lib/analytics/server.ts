export async function trackServerEvent(params: {
  name: string
  category?: string
  label?: string
  value?: number
}) {
  try {
    const measurementId = process.env.NEXT_PUBLIC_GA_ID
    const apiSecret = process.env.GA_API_SECRET // Necesitarás configurar esto
    
    if (!measurementId || !apiSecret) return

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: 'server',
          events: [{
            name: params.name,
            params: {
              category: params.category,
              label: params.label,
              value: params.value
            }
          }]
        })
      }
    )

    if (!response.ok) {
      console.error('Error tracking server event:', await response.text())
    }
  } catch (error) {
    console.error('Error tracking server event:', error)
  }
} 