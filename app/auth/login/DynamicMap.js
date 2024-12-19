'use client'
import { useEffect, useRef, memo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './leaflet-config'

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
}

const DynamicMap = memo(({ userLocation, workArea }) => {
    const mapInstanceRef = useRef(null)
    const markerRef = useRef(null)
    const circleRef = useRef(null)

    useEffect(() => {
        // Asegurarnos de que estamos en el cliente
        if (typeof window === 'undefined') return;

        // Cargar el CSS de Leaflet
        import('leaflet/dist/leaflet.css')

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map('map-container').setView(
                [userLocation.lat, userLocation.lng],
                16
            )

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current)
            
            markerRef.current = L.marker([userLocation.lat, userLocation.lng]).addTo(mapInstanceRef.current)
            circleRef.current = L.circle([workArea.lat, workArea.lng], {
                radius: workArea.radius,
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.2
            }).addTo(mapInstanceRef.current)
        } else {
            markerRef.current.setLatLng([userLocation.lat, userLocation.lng])
            mapInstanceRef.current.setView([userLocation.lat, userLocation.lng])
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
                markerRef.current = null
                circleRef.current = null
            }
        }
    }, [userLocation, workArea])

    const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        workArea.lat,
        workArea.lng
    )

    return (
        <div className="space-y-4">
            <div className={`text-center p-2 rounded ${distance <= workArea.radius ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {distance <= workArea.radius 
                    ? '✅ Estás dentro del área de trabajo'
                    : `❌ Estás a ${Math.round(distance)}m del área permitida`}
            </div>
            <div id="map-container" className="h-[300px] w-full rounded-lg" />
        </div>
    )
})

DynamicMap.displayName = 'DynamicMap'
export default DynamicMap