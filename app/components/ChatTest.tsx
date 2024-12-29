'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/config'

export default function ChatTest() {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('realtime_test')
        .insert([
          {
            message: message
          }
        ])

      if (error) throw error

      setStatus('Mensaje enviado correctamente')
      setMessage('')
    } catch (error) {
      console.error('Error:', error)
      setStatus('Error al enviar el mensaje')
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Prueba de Real-time</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Mensaje de prueba:</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Escribe algo..."
          />
        </div>

        <button 
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Enviar
        </button>

        {status && (
          <p className={`mt-2 ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {status}
          </p>
        )}
      </form>
    </div>
  )
} 