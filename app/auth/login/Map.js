'use client'
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Corregir el ícono de marcador
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
})

export default function Map({ userLocation, workArea }) {
  return (
    <MapContainer
      center={[workArea.lat, workArea.lng]}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} />
      )}
      <Circle
        center={[workArea.lat, workArea.lng]}
        radius={workArea.radius}
        pathOptions={{ color: 'blue', fillColor: 'blue' }}
      />
    </MapContainer>
  )
} 