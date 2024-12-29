const enterprisePermissions = {
  inventory: {
    view: true,      // Permitir ver
    edit: false,     // Deshabilitar edición
    add: false,      // Deshabilitar agregar
    delete: false,   // Deshabilitar eliminar
    use: false,      // Deshabilitar uso de items
    viewStock: true, // Ver niveles de stock
    viewHistory: true, // Ver historial
    viewCritical: true, // Ver items críticos
    export: true     // Permitir exportar reportes
  }
}

export default enterprisePermissions; 