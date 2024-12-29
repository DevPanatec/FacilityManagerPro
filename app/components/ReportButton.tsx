import { PermissionGate } from './PermissionGate'
import { RESOURCES, ACTIONS } from '../lib/types/permissions'

export function ReportButton() {
  return (
    <PermissionGate 
      resource={RESOURCES.REPORTS} 
      action={ACTIONS.CREATE}
      fallback={<p>No tiene permisos para generar reportes</p>}
    >
      <button onClick={handleGenerateReport}>
        Generar Reporte
      </button>
    </PermissionGate>
  )
} 