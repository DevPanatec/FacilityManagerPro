'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/config'

const AVAILABLE_CHANNELS = [
  'activity_logs',
  'analytics_data',
  'areas',
  'attendance_records',
  'audit_logs',
  'backup_history',
  'chat_messages',
  'chat_participants',
  'chat_rooms',
  'dashboard_layouts',
  'dashboard_widgets',
  'departments',
  'documents',
  'employee_records',
  'entity_tags',
  'error_alerts',
  'error_logs',
  'evaluations',
  'kpi_config',
  'location_settings',
  'message_attachments',
  'metrics',
  'notification_preferences',
  'notifications',
  'organization_settings',
  'organizations',
  'performance_metrics',
  'permissions',
  'positions'
]

export default function ChannelSelector() {
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (!selectedChannel) return

    let channel = supabase.channel(`realtime_${selectedChannel}`)
    
    if (isListening) {
      channel = channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: selectedChannel
          },
          (payload) => {
            setMessages(prev => [payload, ...prev])
          }
        )
        .subscribe()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedChannel, isListening])

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-4 items-center">
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Selecciona un canal</option>
          {AVAILABLE_CHANNELS.map(channel => (
            <option key={channel} value={channel}>
              {channel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => setIsListening(!isListening)}
          className={`px-4 py-2 rounded ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>

      {selectedChannel && isListening && (
        <div className="space-y-2">
          <h3 className="font-bold">Mensajes en tiempo real:</h3>
          <div className="max-h-96 overflow-auto space-y-2">
            {messages.map((msg, i) => (
              <pre key={i} className="p-2 bg-gray-100 rounded text-sm">
                {JSON.stringify(msg, null, 2)}
              </pre>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 