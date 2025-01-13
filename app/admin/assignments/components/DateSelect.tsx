import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

interface DateSelectProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
}

export const DateSelect: React.FC<DateSelectProps> = ({ selected, onChange }) => {
  return (
    <div>
      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
        Fecha
      </label>
      <DatePicker
        id="date"
        selected={selected}
        onChange={onChange}
        locale={es}
        dateFormat="dd/MM/yyyy"
        minDate={new Date()}
        placeholderText="Seleccione una fecha"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      />
    </div>
  );
}; 