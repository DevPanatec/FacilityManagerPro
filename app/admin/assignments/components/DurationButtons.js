export const DurationButtons = ({ selectedDuration, onSelect }) => {
  const durations = [
    { id: 'daily', label: 'Diario' },
    { id: 'week', label: 'Semanal' },
    { id: 'biweekly', label: 'Quincenal' },
    { id: 'month', label: 'Mensual' }
  ];

  return (
    <div className="flex space-x-2">
      {durations.map(duration => (
        <button
          key={duration.id}
          type="button"
          onClick={() => onSelect(duration.id)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
            ${selectedDuration === duration.id
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        >
          {duration.label}
        </button>
      ))}
    </div>
  );
}; 