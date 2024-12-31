import { useState } from 'react'
import { format, eachHourOfInterval, startOfDay, endOfDay } from 'date-fns'

interface DayViewProps {
  currentDate: Date
  events: any[]
  onEventClick: (event: any) => void
  onTimeSlotClick: (date: Date) => void
}

export function DayView({ currentDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
  const hours = eachHourOfInterval({ start: startOfDay(currentDate), end: endOfDay(currentDate) })

  return (
    <div className="space-y-1">
      {hours.map(hour => {
        const timeSlotEvents = events.filter(event => {
          const eventStart = new Date(event.start_date)
          return (
            eventStart.getFullYear() === currentDate.getFullYear() &&
            eventStart.getMonth() === currentDate.getMonth() &&
            eventStart.getDate() === currentDate.getDate() &&
            eventStart.getHours() === hour.getHours()
          )
        })

        return (
          <div
            key={hour.toISOString()}
            className="grid grid-cols-[100px_1fr] gap-4"
          >
            {/* Columna de hora */}
            <div className="p-2 text-right font-medium">
              {format(hour, 'HH:mm')}
            </div>

            {/* Columna de eventos */}
            <div
              className="p-2 border rounded-lg min-h-[60px] cursor-pointer hover:bg-gray-50"
              onClick={() => onTimeSlotClick(hour)}
            >
              {timeSlotEvents.map(event => (
                <div
                  key={event.id}
                  className="text-sm p-2 bg-blue-100 rounded mb-1"
                  onClick={e => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {event.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
} 