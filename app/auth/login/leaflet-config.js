import L from 'leaflet'

// Configuración global de Leaflet
if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl

    // Actualizar las rutas de los iconos para usar CDN
    L.Icon.Default.mergeOptions({
        iconUrl: '/leaflet/marker-icon.png',
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        shadowUrl: '/leaflet/marker-shadow.png'
    })
}