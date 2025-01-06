import { useState } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface WeekViewProps {
  currentDate: Date
  events: any[]
  onEventClick: (event: any) => void
  onTimeSlotClick: (date: Date) => void
}

export function WeekView({ currentDate, events, onEventClick, onTimeSlotClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: es })
  const weekEnd = endOfWeek(currentDate, { locale: es })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const hours = eachHourOfInterval({ start: startOfDay(currentDate), end: endOfDay(currentDate) })

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Encabezado con días */}
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2 text-center font-semibold">Hora</div>
          {days.map(day => (
            <div key={day.toISOString()} className="p-2 text-center font-semibold">
              {format(day, 'EEE d', { locale: es })}
            </div>
          ))}
        </div>

        {/* Grid de horas y eventos */}
        {hours.map(hour => (
          <div key={hour.toISOString()} className="grid grid-cols-8 gap-1">
            {/* Columna de hora */}
            <div className="p-2 text-center border-r">
              {format(hour, 'HH:mm')}
            </div>

            {/* Columnas de días */}
            {days.map(day => {
              const timeSlotDate = new Date(
                day.getFullYear(),
                day.getMonth(),
                day.getDate(),
                hour.getHours()
              )

              const timeSlotEvents = events.filter(event => {
                const eventStart = new Date(event.start_date)
                return (
                  eventStart.getFullYear() === timeSlotDate.getFullYear() &&
                  eventStart.getMonth() === timeSlotDate.getMonth() &&
                  eventStart.getDate() === timeSlotDate.getDate() &&
                  eventStart.getHours() === timeSlotDate.getHours()
                )
              })

              return (
                <div
                  key={timeSlotDate.toISOString()}
                  className="p-1 border min-h-[50px] cursor-pointer hover:bg-gray-50"
                  onClick={() => onTimeSlotClick(timeSlotDate)}
                >
                  {timeSlotEvents.map(event => (
                    <div
                      key={event.id}
                      className="text-sm p-1 bg-blue-100 rounded mb-1 truncate"
                      onClick={e => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
} 