import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

export function DateSelect({ date, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Fecha
      </label>
      <DatePicker
        selected={date}
        onChange={onChange}
        locale={es}
        dateFormat="dd/MM/yyyy"
        minDate={new Date()}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholderText="Seleccionar fecha"
      />
    </div>
  );
} 