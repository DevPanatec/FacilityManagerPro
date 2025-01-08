import DatePicker from 'react-datepicker';
import { FaCalendarAlt } from 'react-icons/fa';
import "react-datepicker/dist/react-datepicker.css";

export const DateSelect = ({ selected, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-blue-600 mb-1 flex items-center gap-2">
      <FaCalendarAlt className="h-5 w-5" />
      Fecha de Asignación
    </label>
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        minDate={new Date()}
        className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
        placeholderText="Seleccionar fecha"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaCalendarAlt className="h-5 w-5 text-blue-400" />
      </div>
    </div>
  </div>
); 