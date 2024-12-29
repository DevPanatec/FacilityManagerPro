// Funciones para manejar reportes offline
export async function getPendingReports() {
  // Obtener reportes pendientes del IndexedDB
  const db = await openDB('offlineDB', 1, {
    upgrade(db) {
      db.createObjectStore('pendingReports', { keyPath: 'id' })
    }
  })
  return db.getAll('pendingReports')
}

export async function sendReport(report: any) {
  const response = await fetch('/api/reports', {
    method: 'POST',
    body: JSON.stringify(report)
  })
  if (!response.ok) throw new Error('Error al enviar reporte')
  return response.json()
}

export async function markReportAsSynced(reportId: string) {
  const db = await openDB('offlineDB', 1)
  await db.delete('pendingReports', reportId)
} 