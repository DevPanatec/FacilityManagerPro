'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

interface Area {
  id: string
  name: string
  description: string | null
  organization_id: string
  parent_id: string | null
  status: 'active' | 'inactive'
  sala_id: string | null
  created_at: string
  updated_at: string
}

interface Sala {
  id: string
  nombre: string
  organization_id: string
  estado: boolean
  created_at: string
  updated_at: string
}

interface SalaAreaSelectorProps {
  onSalaChange?: (sala: Sala | null) => void
  onAreaChange?: (area: Area | null) => void
  defaultSalaId?: string
  defaultAreaId?: string
  className?: string
}

export default function SalaAreaSelector({
  onSalaChange,
  onAreaChange,
  defaultSalaId,
  defaultAreaId,
  className = '',
}: SalaAreaSelectorProps) {
  const [salas, setSalas] = useState<Sala[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedSala, setSelectedSala] = useState<string | null>(defaultSalaId || null)
  const [selectedArea, setSelectedArea] = useState<string | null>(defaultAreaId || null)
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Obtener el usuario actual y su organization_id
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('Error de autenticación:', authError)
          throw new Error('Error de autenticación: ' + authError.message)
        }
        
        if (!user) {
          console.error('No hay usuario autenticado')
          throw new Error('No autorizado - Usuario no encontrado')
        }

        // Obtener perfil completo del usuario
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('organization_id, role')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Error al obtener perfil de usuario:', userError)
          throw new Error('Error al obtener perfil: ' + userError.message)
        }

        if (!userProfile?.organization_id) {
          console.error('Usuario sin organización asignada')
          throw new Error('Usuario sin organización asignada')
        }

        // Cargar salas
        const { data: salasData, error: salasError } = await supabase
          .from('salas')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .eq('estado', true)

        if (salasError) {
          console.error('Error al cargar salas:', {
            error: salasError,
            organizationId: userProfile.organization_id
          })
          throw new Error('Error al cargar salas: ' + salasError.message)
        }

        // Cargar áreas
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .eq('status', 'active')

        if (areasError) {
          console.error('Error al cargar áreas:', {
            error: areasError,
            organizationId: userProfile.organization_id
          })
          throw new Error('Error al cargar áreas: ' + areasError.message)
        }

        // Verificar y establecer los datos
        const validSalas = Array.isArray(salasData) ? salasData : []
        const validAreas = Array.isArray(areasData) ? areasData : []

        console.log('Datos cargados exitosamente:', {
          salas: validSalas.length,
          areas: validAreas.length,
          organizationId: userProfile.organization_id
        })

        setSalas(validSalas)
        setAreas(validAreas)
        
        if (defaultSalaId) {
          const filteredAreas = validAreas.filter(area => area.sala_id === defaultSalaId)
          setFilteredAreas(filteredAreas)
        }

      } catch (error) {
        console.error('Error detallado en SalaAreaSelector:', {
          error,
          message: error instanceof Error ? error.message : 'Error desconocido',
          stack: error instanceof Error ? error.stack : undefined
        })
        setSalas([])
        setAreas([])
        setFilteredAreas([])
        // Aquí podrías agregar una notificación al usuario si lo deseas
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, defaultSalaId])

  useEffect(() => {
    if (selectedSala) {
      console.log('Sala seleccionada:', selectedSala)
      console.log('Todas las áreas disponibles:', areas)
      
      const filtered = areas.filter(area => {
        console.log('Comparando área:', {
          area_sala_id: area.sala_id,
          selected_sala_id: selectedSala,
          matches: area.sala_id === selectedSala
        })
        return area.sala_id === selectedSala
      })
      
      console.log('Áreas filtradas para la sala:', filtered)
      setFilteredAreas(filtered)
      
      // Si el área seleccionada no está en la lista filtrada, limpiarla
      if (selectedArea && !filtered.find(area => area.id === selectedArea)) {
        setSelectedArea(null)
        onAreaChange?.(null)
      }
    } else {
      setFilteredAreas([])
      setSelectedArea(null)
      onAreaChange?.(null)
    }
  }, [selectedSala, areas, selectedArea])

  const handleSalaChange = (salaId: string) => {
    console.log('Cambiando sala a:', salaId)
    const sala = salas.find(s => s.id === salaId) || null
    console.log('Sala encontrada:', sala)
    setSelectedSala(salaId || null)
    onSalaChange?.(sala)
    setSelectedArea(null)
    onAreaChange?.(null)
  }

  const handleAreaChange = (areaId: string) => {
    console.log('Cambiando área a:', areaId)
    const area = areas.find(a => a.id === areaId) || null
    console.log('Área encontrada:', area)
    setSelectedArea(areaId || null)
    onAreaChange?.(area)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sala</label>
          <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Área</label>
          <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Sala
        </label>
        <select 
          className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={selectedSala || ''}
          onChange={(e) => handleSalaChange(e.target.value)}
        >
          <option value="">Seleccionar Sala</option>
          {salas.map((sala) => (
            <option key={sala.id} value={sala.id}>
              {sala.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Área
        </label>
        <select 
          className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={selectedArea || ''}
          onChange={(e) => handleAreaChange(e.target.value)}
          disabled={!selectedSala}
        >
          <option value="">Seleccionar Área</option>
          {filteredAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 