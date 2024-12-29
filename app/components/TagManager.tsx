'use client'

import { useState, useEffect } from 'react'
import { Tag } from '@/lib/types/tags'

interface TagManagerProps {
  organizationId: string
  onTagSelect?: (tag: Tag) => void
}

export function TagManager({ organizationId, onTagSelect }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [newTag, setNewTag] = useState({ name: '', color: '#000000' })

  // Cargar etiquetas
  useEffect(() => {
    loadTags()
  }, [organizationId])

  const loadTags = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tags?organization_id=${organizationId}`)
      if (!response.ok) throw new Error('Error al cargar etiquetas')
      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        body: JSON.stringify({
          ...newTag,
          organization_id: organizationId
        })
      })
      if (!response.ok) throw new Error('Error al crear etiqueta')
      const tag = await response.json()
      setTags([...tags, tag])
      setNewTag({ name: '', color: '#000000' })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Error al eliminar etiqueta')
      setTags(tags.filter(tag => tag.id !== tagId))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Gestionar Etiquetas</h2>
      
      {/* Formulario para crear etiquetas */}
      <form onSubmit={handleCreateTag} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTag.name}
          onChange={e => setNewTag({ ...newTag, name: e.target.value })}
          placeholder="Nombre de la etiqueta"
          className="px-2 py-1 border rounded"
        />
        <input
          type="color"
          value={newTag.color}
          onChange={e => setNewTag({ ...newTag, color: e.target.value })}
          className="w-10 h-10"
        />
        <button 
          type="submit"
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Crear
        </button>
      </form>

      {/* Lista de etiquetas */}
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="space-y-2">
          {tags.map(tag => (
            <div 
              key={tag.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: tag.color }}
                />
                <span>{tag.name}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onTagSelect?.(tag)}
                  className="px-2 py-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  Seleccionar
                </button>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="px-2 py-1 text-sm text-red-500 hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 