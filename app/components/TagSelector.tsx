'use client'

import { useState, useEffect } from 'react'
import { Tag } from '@/lib/types/tags'

interface TagSelectorProps {
  organizationId: string
  entityType: string
  entityId: string
  onTagsChange?: (tags: Tag[]) => void
}

export function TagSelector({ 
  organizationId, 
  entityType, 
  entityId,
  onTagsChange 
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar etiquetas disponibles y seleccionadas
  useEffect(() => {
    loadTags()
  }, [organizationId, entityType, entityId])

  const loadTags = async () => {
    try {
      setLoading(true)
      // Cargar todas las etiquetas
      const tagsResponse = await fetch(`/api/tags?organization_id=${organizationId}`)
      if (!tagsResponse.ok) throw new Error('Error al cargar etiquetas')
      const allTags = await tagsResponse.json()
      setAvailableTags(allTags)

      // Cargar etiquetas asignadas
      const entityTagsResponse = await fetch(
        `/api/tags/assign?entity_type=${entityType}&entity_id=${entityId}`
      )
      if (!entityTagsResponse.ok) throw new Error('Error al cargar etiquetas asignadas')
      const entityTags = await entityTagsResponse.json()
      setSelectedTags(entityTags)
      onTagsChange?.(entityTags)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTagSelect = async (tag: Tag) => {
    try {
      const response = await fetch('/api/tags/assign', {
        method: 'POST',
        body: JSON.stringify({
          tag_id: tag.id,
          entity_type: entityType,
          entity_id: entityId,
          organization_id: organizationId
        })
      })
      if (!response.ok) throw new Error('Error al asignar etiqueta')
      
      const newSelectedTags = [...selectedTags, tag]
      setSelectedTags(newSelectedTags)
      onTagsChange?.(newSelectedTags)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleTagRemove = async (tag: Tag) => {
    try {
      const response = await fetch(
        `/api/tags/assign?tag_id=${tag.id}&entity_type=${entityType}&entity_id=${entityId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error('Error al remover etiqueta')
      
      const newSelectedTags = selectedTags.filter(t => t.id !== tag.id)
      setSelectedTags(newSelectedTags)
      onTagsChange?.(newSelectedTags)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-4">
      {/* Etiquetas seleccionadas */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <div
            key={tag.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
            style={{ backgroundColor: tag.color + '20' }}
          >
            <span style={{ color: tag.color }}>{tag.name}</span>
            <button
              onClick={() => handleTagRemove(tag)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Selector de etiquetas */}
      <div className="relative">
        <select
          onChange={(e) => {
            const tag = availableTags.find(t => t.id === e.target.value)
            if (tag) handleTagSelect(tag)
          }}
          className="w-full px-3 py-2 border rounded"
          value=""
        >
          <option value="">Agregar etiqueta...</option>
          {availableTags
            .filter(tag => !selectedTags.some(st => st.id === tag.id))
            .map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  )
} 