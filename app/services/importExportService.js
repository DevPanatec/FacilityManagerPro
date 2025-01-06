import { createClient } from '../utils/supabase/client'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export const importExportService = {
  async exportToJson(organizationId) {
    const supabase = createClient()
    const { data, error } = await supabase
      .rpc('export_organization_data', { org_id: organizationId })
    
    if (error) throw error
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `organization_${organizationId}.json`)
  },

  async exportToExcel(organizationId) {
    const { data, error } = await supabase
      .rpc('export_organization_data', { org_id: organizationId })
    
    if (error) throw error
    
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet([data.organization])
    XLSX.utils.book_append_sheet(wb, ws, 'Organization')
    
    XLSX.writeFile(wb, `organization_${organizationId}.xlsx`)
  }
} 