import React from 'react';
import { FaCalendarAlt, FaClock, FaRegCalendarCheck } from 'react-icons/fa';

interface DurationButtonsProps {
  selectedDuration: string | null;
  onSelect: (duration: string) => void;
}

interface Duration {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const durations: Duration[] = [
  {
    id: 'daily',
    label: 'Diario',
    icon: <FaClock className="w-4 h-4" />
  },
  {
    id: 'weekly',
    label: 'Semanal',
    icon: <FaCalendarAlt className="w-4 h-4" />
  },
  {
    id: 'monthly',
    label: 'Mensual',
    icon: <FaRegCalendarCheck className="w-4 h-4" />
  }
];

export const DurationButtons: React.FC<DurationButtonsProps> = ({ selectedDuration, onSelect }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Duración
      </label>
      <div className="mt-1 grid grid-cols-3 gap-3">
        {durations.map((duration) => (
          <button
            key={duration.id}
            type="button"
            onClick={() => onSelect(duration.id)}
            className={`
              flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md
              transition-colors duration-200
              ${selectedDuration === duration.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="mr-2">{duration.icon}</span>
            {duration.label}
          </button>
        ))}
      </div>
    </div>
  );
}; 