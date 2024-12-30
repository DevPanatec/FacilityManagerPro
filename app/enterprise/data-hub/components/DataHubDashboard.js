'use client'
import { useState, useEffect } from 'react'
import { dataHubService } from '@/services/dataHubService'

export default function DataHubDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    try {
      setLoading(true)
      const data = await dataHubService.getDataHubSummary()
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format) {
    try {
      setLoading(true)
      await dataHubService.exportEnterpriseData(format)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    try {
      setLoading(true)
      const importedData = await dataHubService.importExternalData()
      await loadSummary() // Recargar el resumen
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex gap-4">
        <button onClick={() => handleExport('json')}>Exportar JSON</button>
        <button onClick={() => handleExport('excel')}>Exportar Excel</button>
        <button onClick={() => handleExport('csv')}>Exportar CSV</button>
        <button onClick={handleImport}>Importar Datos Externos</button>
      </div>

      {/* Datos Internos */}
      <div>
        <h2>Datos del Enterprise</h2>
        <div className="grid grid-cols-3 gap-4">
          {summary?.internalData?.map(org => (
            <div key={org.id} className="p-4 border rounded">
              <h3>{org.nombre}</h3>
              <p>Áreas: {org.total_areas}</p>
              <p>Estado: {org.estado}</p>
              <p>Última actualización: {new Date(org.ultima_actualizacion).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Datos Externos */}
      <div>
        <h2>Datos Externos</h2>
        <div className="grid grid-cols-3 gap-4">
          {summary?.externalData?.map(source => (
            <div key={source.id} className="p-4 border rounded">
              <h3>{source.source_name}</h3>
              <p>Última actualización: {new Date(source.last_updated).toLocaleDateString()}</p>
              <pre className="text-sm">{JSON.stringify(source.data, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 