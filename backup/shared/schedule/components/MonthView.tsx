import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns'

interface MonthViewProps {
  currentDate: Date
  events: any[]
  onEventClick: (event: any) => void
  onDayClick: (date: Date) => void
}

export function MonthView({ currentDate, events, onEventClick, onDayClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Encabezados de días */}
      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
        <div key={day} className="p-2 text-center font-semibold">
          {day}
        </div>
      ))}

      {/* Días del mes */}
      {days.map(day => {
        const dayEvents = events.filter(event => 
          format(new Date(event.start_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        )

        return (
          <div
            key={day.toISOString()}
            className={`min-h-[100px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
              !isSameMonth(day, currentDate) ? 'bg-gray-100' : ''
            }`}
            onClick={() => onDayClick(day)}
          >
            <div className="font-medium">{format(day, 'd')}</div>
            <div className="space-y-1">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="text-sm p-1 bg-blue-100 rounded truncate"
                  onClick={e => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
} 