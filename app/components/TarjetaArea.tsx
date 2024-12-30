'use client'
import React from 'react';
import { FaClock } from 'react-icons/fa';

interface Area {
  id: number;
  nombre: string;
  fecha?: string;
}

interface TarjetaAreaProps {
  area: Area;
}

const TarjetaArea: React.FC<TarjetaAreaProps> = ({ area }) => {
  // Función para formatear la fecha de manera consistente
  const formatDate = (dateString?: string) => {
    try {
      if (!dateString) return "28/11/2024, 08:15";
      
      const date = new Date(dateString);
      const formatter = new Intl.DateTimeFormat('es', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      return formatter.format(date);
    } catch {
      return "28/11/2024, 08:15";
    }
  };

  return (
    <div className={"bg-white..."}>
      <div>
        <div className="flex-1 ove...">
          <div className="space-y-3">
            <div className="bg-gray-50...">
              <div className="flex justi...">
                <div className="space-y-2">
                  <div className="flex flex-...">
                    <div className="flex items-center gap-2">
                      <FaClock />
                      <span suppressHydrationWarning>
                        {formatDate(area.fecha)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarjetaArea; 